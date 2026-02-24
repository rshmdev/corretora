'use client';

import React from "react";
import { createContext, useContext, ReactNode } from "react";
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';


interface AuthContextType {
    login: (email: string, password: string) => Promise<void>;
    register: (
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        phone: string
    ) => Promise<void>;
    verify: () => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();

    const trim = (value: string) => (value ?? '').trim();
    const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isStrongEnoughPassword = (value: string) => trim(value).length >= 6;
    const normalizePhone = (value: string) => (value ?? '').replace(/\D/g, '');
    const isValidPhone = (value: string) => normalizePhone(value).length >= 8;

    const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}, ms = 15000) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), ms);
        try {
            const response = await fetch(input, { ...init, signal: controller.signal });
            return response;
        } finally {
            clearTimeout(timeout);
        }
    };

    const setCookie = (name: string, value: string, days = 30) => {
        try {
            const maxAge = days * 24 * 60 * 60;
            const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
            const secure = isHttps ? '; secure' : '';
            document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
        } catch {}
    }

    const login = async (email: string, password: string) => {
        try {
            const emailTrimmed = trim(email);
            const passwordTrimmed = trim(password);
            if (!isValidEmail(emailTrimmed)) {
                throw new Error('E-mail inválido');
            }
            if (!isStrongEnoughPassword(passwordTrimmed)) {
                throw new Error('Senha deve ter pelo menos 6 caracteres');
            }

            const response = await fetchWithTimeout(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: emailTrimmed, password: passwordTrimmed }),
            })
        
            if (!response.ok) {
                throw new Error('Falha ao autenticar');
            }
            const json = await response.json();
            if (json.status) {
                localStorage.setItem('token', json.data);
                setCookie('token', json.data);
                toast.success('Login realizado com sucesso. Bem-vindo de volta!');
                try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app:auth-success')); } catch {}
                router.replace('/app/traderoom');
                return;
            }
            throw new Error('Credenciais inválidas');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    const register = async (
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        phone: string
    ) => {
        try {
            const firstNameTrimmed = trim(firstName);
            const lastNameTrimmed = trim(lastName);
            const emailTrimmed = trim(email);
            const passwordTrimmed = trim(password);
            const phoneNormalized = normalizePhone(phone);

            if (!firstNameTrimmed || !lastNameTrimmed) {
                throw new Error('Nome e sobrenome são obrigatórios');
            }
            if (!isValidEmail(emailTrimmed)) {
                throw new Error('E-mail inválido');
            }
            if (!isStrongEnoughPassword(passwordTrimmed)) {
                throw new Error('Senha deve ter pelo menos 6 caracteres');
            }
            if (!isValidPhone(phoneNormalized)) {
                throw new Error('Telefone inválido');
            }

            // Capturar referralCode persistido
            let referralCode: string | undefined = undefined;
            try { referralCode = localStorage.getItem('referralCode') || undefined; } catch {}

            const body: Record<string, any> = { firstName: firstNameTrimmed, lastName: lastNameTrimmed, email: emailTrimmed, password: passwordTrimmed, phone: phoneNormalized };
            if (referralCode) body.referralCode = referralCode;

            const response = await fetchWithTimeout(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            })

            if (!response.ok) {
                throw new Error('Falha no registro');
            }
            const json = await response.json();
            if (json.status) {
                localStorage.setItem('token', json.data);
                setCookie('token', json.data);
                toast.success('Conta criada com sucesso. Bem-vindo!');
                try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app:auth-success')); } catch {}
                router.replace('/app/traderoom');
                return;
            }
            throw new Error('Dados inválidos para registro');
        } catch (error) {
            console.error('Register failed:', error);
            throw error;
        }   
    }

    const verify = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;
            const response = await fetchWithTimeout(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            })
            if (!response.ok) return false;
            const json = await response.json();
            return !!json.status;
        } catch (error) {
            console.error('Verify failed:', error);
            return false;
        }
    }

    const logout = async () => {
        try {
            // Notificar outras partes da app (ex.: AccountContext)
            try {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('app:logout'));
                }
            } catch {}

            // Limpar storages
            try { localStorage.clear(); } catch {}
            try { sessionStorage.clear(); } catch {}

            // Limpar cookies (melhor esforço)
            try {
                if (typeof document !== 'undefined') {
                    const cookies = document.cookie ? document.cookie.split('; ') : [];
                    for (const cookie of cookies) {
                        const eqPos = cookie.indexOf('=');
                        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${location.hostname}`;
                    }
                }
            } catch {}

            // Limpar Cache Storage
            try {
                if (typeof window !== 'undefined' && 'caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                }
            } catch {}

            // Unregister Service Workers
            try {
                if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map((r) => r.unregister()));
                }
            } catch {}

            // Limpar IndexedDB (quando suportado)
            try {
                const anyIndexed: any = indexedDB as any;
                if (anyIndexed && typeof anyIndexed.databases === 'function') {
                    const dbs: Array<{ name?: string }> = await anyIndexed.databases();
                    await Promise.all(
                        dbs.map((db) =>
                            db?.name
                                ? new Promise<void>((resolve) => {
                                      const req = indexedDB.deleteDatabase(db.name as string);
                                      req.onsuccess = () => resolve();
                                      req.onerror = () => resolve();
                                      req.onblocked = () => resolve();
                                  })
                                : Promise.resolve()
                        )
                    );
                }
            } catch {}
        } finally {
            try { toast.info('Sessão encerrada'); } catch {}
            router.replace('/auth/login');
        }
    }

    return (
        <AuthContext.Provider value={{ login, register, verify, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}


