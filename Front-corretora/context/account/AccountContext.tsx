'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Client, type IStompSocket } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useWs } from '@/context/ws/WsContext';
import { useAuth } from '@/context/auth';
import { toast } from 'react-toastify';

type Account = Record<string, unknown>;

interface AccountContextType {
  account: Account | null;
  loading: boolean;
  error: string | null;
  refreshAccount: () => Promise<void>;
  disconnectWs: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, ms = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function resolveWsUrl(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_WS_URL;
  if (fromEnv && typeof fromEnv === 'string') return fromEnv;
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) return null;
  try {
    const url = new URL(api);
    return `${url.origin}/ws`;
  } catch {
    return null;
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const [account, setAccount] = useState<Account | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('account');
      return cached ? (JSON.parse(cached) as Account) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const tokenRef = useRef<string | null>(null);
  const accountRef = useRef<Account | null>(null);
  const subscribedIdRef = useRef<string | null>(null);
  const activeSubscriptionRef = useRef<ReturnType<Client['subscribe']> | null>(null);

  const persistAccount = useCallback((data: Account | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (data) localStorage.setItem('account', JSON.stringify(data));
      else localStorage.removeItem('account');
    } catch {}
  }, []);

  const refreshAccount = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setAccount(null);
      persistAccount(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(`${process.env.NEXT_PUBLIC_API_URL}/v1/account`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        try { toast.info('Sessão expirada. Faça login novamente.'); } catch {}
        await logout();
        return;
      }
      if (!response.ok) {
        throw new Error('Falha ao obter dados da conta');
      }
      const data = (await response.json()) as Account;
      setAccount(data.data as Account);
      persistAccount(data.data as Account);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [persistAccount, logout]);

  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  const disconnectWs = useCallback(() => {
    const client = clientRef.current;
    if (client) {
      try {
        client.deactivate();
      } catch {}
      clientRef.current = null;
    }
    // reset controle de inscrição
    subscribedIdRef.current = null;
    activeSubscriptionRef.current = null;
  }, []);

  function getAccountId(source: Account | null): string | null {
    if (!source) return null;
    const candidates = [
      (source as any)?.accountId,
      (source as any)?.account_id,
      (source as any)?.id,
      (source as any)?.uuid,
    ];
    const found = candidates.find((v) => typeof v === 'string' || typeof v === 'number');
    return found != null ? String(found) : null;
  }

  const { subscribe: wsSubscribe } = useWs();

  const ensureSubscribed = useCallback(() => {
    const token = tokenRef.current;
    if (!token) return;
    const id = getAccountId(accountRef.current);
    if (!id) return;
    if (subscribedIdRef.current === id) return;

    const destination = `/topic/account/${id}`;
    const handleMessage = async (msg: any) => {
      try {
        const payload = msg.body ? JSON.parse(msg.body) : null;
        if (payload && typeof payload === 'object') {
          setAccount((prev) => {
            const next = { ...(prev ?? {}), ...(payload as Account) } as Account;
            persistAccount(next);
            return next;
          });
        }
      } catch {}
      refreshAccount().catch(() => {});
    };

    try { activeSubscriptionRef.current?.unsubscribe(); } catch {}
    const unsubscribe = wsSubscribe(destination, handleMessage, { Authorization: `Bearer ${token}` });
    // adapt: guardamos um wrapper para compat de unsubscribe
    activeSubscriptionRef.current = { unsubscribe } as any;
    subscribedIdRef.current = id;
  }, [persistAccount, refreshAccount, wsSubscribe]);

  const { subscribe, reconnect, disconnect } = useWs();

  const connectWs = useCallback(() => {
    const wsUrl = resolveWsUrl();
    const token = getToken();
    tokenRef.current = token;
    if (!wsUrl || !token) {
      return;
    }
    // Com WsContext, apenas asseguramos que haverá reconexão e assinatura
    // Se não houver id ainda, forçamos refresh e depois assinamos
    ensureSubscribed();
    if (!getAccountId(accountRef.current)) {
      refreshAccount().finally(() => ensureSubscribed());
    }
  }, [ensureSubscribed, refreshAccount]);

  useEffect(() => {
    // Primeira carga dos dados da conta
    refreshAccount();
  }, [refreshAccount]);

  useEffect(() => {
    // Conecta/desconecta o websocket conforme disponibilidade de token
    connectWs();
    return () => {
      try { disconnect(); } catch {}
    };
  }, [connectWs, disconnect]);

  useEffect(() => {
    // Quando conta mudar e houver conexão, garante que estamos inscrevidos no id correto
    ensureSubscribed();
  }, [account, ensureSubscribed]);

  useEffect(() => {
    // Reagir ao logout global: desconectar WS e limpar cache da conta
    function onLogout() {
      try { disconnectWs(); } catch {}
      setAccount(null);
      persistAccount(null);
    }
    function onAuthSuccess() {
      refreshAccount();
      connectWs();
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('app:logout', onLogout as EventListener);
      window.addEventListener('app:auth-success', onAuthSuccess as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('app:logout', onLogout as EventListener);
        window.removeEventListener('app:auth-success', onAuthSuccess as EventListener);
      }
    };
  }, [disconnectWs, persistAccount, refreshAccount, connectWs]);

  const value = useMemo<AccountContextType>(() => ({
    account,
    loading,
    error,
    refreshAccount,
    disconnectWs,
  }), [account, loading, error, refreshAccount, disconnectWs]);

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within an AccountProvider');
  return ctx;
}


