'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Client, type IFrame, type IMessage, type IStompSocket, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type MessageHandler = (message: IMessage) => void;

interface WsContextType {
  connected: boolean;
  subscribe: (destination: string, handler: MessageHandler, headers?: Record<string, string>) => () => void;
  send: (destination: string, body: string, headers?: Record<string, string>) => boolean;
  disconnect: () => void;
  reconnect: () => void;
}

const WsContext = createContext<WsContextType | undefined>(undefined);

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('token'); } catch { return null; }
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

type DestinationState = {
  callbacks: Set<MessageHandler>;
  subscription: StompSubscription | null;
  headers?: Record<string, string>;
};

export function WsProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const tokenRef = useRef<string | null>(null);
  const destinationsRef = useRef<Map<string, DestinationState>>(new Map());

  const ensureClient = useCallback(() => {
    const wsUrl = resolveWsUrl();
    const token = getToken();
    tokenRef.current = token;
    if (!wsUrl || !token) return;

    const existing = clientRef.current;
    if (existing && existing.active) return;

    const client = new Client({
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 2000,
      debug: () => undefined,
      onConnect: (_frame: IFrame) => {
        setConnected(true);
        // (re)inscrever destinos existentes
        for (const [destination, state] of destinationsRef.current.entries()) {
          try {
            state.subscription?.unsubscribe();
          } catch {}
          const sub = client.subscribe(
            destination,
            (msg) => {
              for (const cb of state.callbacks) cb(msg);
            },
            { Authorization: `Bearer ${tokenRef.current}` || '' , ...(state.headers || {}) }
          );
          state.subscription = sub;
        }
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: () => {
        setConnected(false);
      },
      onWebSocketClose: () => {
        setConnected(false);
        // não limpamos callbacks; reconexão cuidará de re-assinar
        for (const [, state] of destinationsRef.current.entries()) {
          state.subscription = null;
        }
      },
    });
    client.webSocketFactory = () => new SockJS(wsUrl) as unknown as IStompSocket;

    clientRef.current = client;
    client.activate();
  }, []);

  const reconnect = useCallback(() => {
    try { clientRef.current?.deactivate(); } catch {}
    clientRef.current = null;
    setConnected(false);
    ensureClient();
  }, [ensureClient]);

  const disconnect = useCallback(() => {
    try { clientRef.current?.deactivate(); } catch {}
    clientRef.current = null;
    setConnected(false);
    // mantém callbacks, mas remove subscriptions ativas
    for (const [, state] of destinationsRef.current.entries()) {
      try { state.subscription?.unsubscribe(); } catch {}
      state.subscription = null;
    }
  }, []);

  const subscribe = useCallback<WsContextType['subscribe']>((destination, handler, headers) => {
    let state = destinationsRef.current.get(destination);
    if (!state) {
      state = { callbacks: new Set(), subscription: null, headers };
      destinationsRef.current.set(destination, state);
    }
    state.headers = { ...(state.headers || {}), ...(headers || {}) };
    state.callbacks.add(handler);

    const client = clientRef.current;
    if (client?.connected) {
      try { state.subscription?.unsubscribe(); } catch {}
      state.subscription = client.subscribe(
        destination,
        (msg) => { for (const cb of state!.callbacks) cb(msg); },
        { Authorization: `Bearer ${tokenRef.current}` || '', ...(state.headers || {}) }
      );
    } else {
      ensureClient();
    }

    return () => {
      const s = destinationsRef.current.get(destination);
      if (!s) return;
      s.callbacks.delete(handler);
      if (s.callbacks.size === 0) {
        try { s.subscription?.unsubscribe(); } catch {}
        destinationsRef.current.delete(destination);
      }
    };
  }, [ensureClient]);

  const send = useCallback<WsContextType['send']>((destination, body, headers) => {
    const client = clientRef.current;
    if (client?.connected) {
      client.publish({
        destination,
        body,
        headers: { Authorization: `Bearer ${tokenRef.current}` || '', ...(headers || {}) },
      });
      return true;
    }
    ensureClient();
    return false;
  }, [ensureClient]);

  useEffect(() => {
    // inicializa cliente
    ensureClient();
  }, [ensureClient]);

  useEffect(() => {
    function onAuthSuccess() { reconnect(); }
    function onLogout() { disconnect(); }
    if (typeof window !== 'undefined') {
      window.addEventListener('app:auth-success', onAuthSuccess as EventListener);
      window.addEventListener('app:logout', onLogout as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('app:auth-success', onAuthSuccess as EventListener);
        window.removeEventListener('app:logout', onLogout as EventListener);
      }
    };
  }, [disconnect, reconnect]);

  const value = useMemo<WsContextType>(() => ({ connected, subscribe, send, disconnect, reconnect }), [connected, subscribe, send, disconnect, reconnect]);

  return (
    <WsContext.Provider value={value}>{children}</WsContext.Provider>
  );
}

export function useWs() {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error('useWs must be used within a WsProvider');
  return ctx;
}


