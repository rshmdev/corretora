"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { ArrowUpRight, Users, FileText, TrendingUp, TrendingDown, Activity, BarChart2 } from "lucide-react";

function StatCard({ title, value, icon, color, description }: { title: string, value: string, icon: React.ReactNode, color: string, description: string }) {
  return (
    <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow flex flex-col items-start w-full">
      <div className="flex items-center gap-3 mb-2">
        <span className={`p-2 rounded-lg bg-opacity-20 ${color}`}>{icon}</span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <span className="text-xs text-gray-400 mt-1">{description}</span>
    </div>
  );
}

function QuickLink({ href, children, icon, color }: { href: string, children: React.ReactNode, icon: React.ReactNode, color: string }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 ${color} hover:brightness-110 text-white px-5 py-3 rounded-lg font-medium transition shadow`}
    >
      {icon}
      {children}
      <ArrowUpRight className="w-4 h-4 opacity-70" />
    </a>
  );
}

type LastOperation = {
  id: string;
  accountId: string;
  pair: string;
  interval: string;
  arrow: 'UP' | 'DOWN' | string;
  bet: number;
  result: number;
  starredPrice?: number;
  finishedPrice?: number;
  status: string;
  createdAt: number;
  finishIn?: number;
  user?: string;
};

function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - Number(ts || 0));
  const s = Math.floor(diff / 1000);
  if (s < 60) return `há ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
}

function RecentActivity({ items }: { items: LastOperation[] }) {
  return (
    <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow flex flex-col w-full">
      <h3 className="text-lg font-semibold text-white mb-4">Atividades Recentes</h3>
      {(!items || items.length === 0) && (
        <div className="text-sm text-gray-400">Sem operações recentes.</div>
      )}
      {items && items.length > 0 && (
        <ul className="divide-y divide-neutral-800">
          {items.slice(0, 5).map((op) => {
            const status = String(op.status || '').toUpperCase();
            const pnl = Number(op.result ?? 0);
            const isWin = status === 'WIN' || pnl > 0;
            const isLoss = status === 'LOSE' || pnl < 0;
            return (
              <li key={op.id} className="flex items-center gap-3 py-2">
                {isWin ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : isLoss ? (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                ) : (
                  <Activity className="w-5 h-5 text-gray-400" />
                )}
                <div className="flex-1">
                  <span className="text-white text-sm">{op.user || 'Usuário'}</span>
                  <span className="ml-2 text-xs text-gray-400">Aposta R$ {Number(op.bet ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  {isWin && (
                    <span className="ml-2 text-xs font-bold text-green-400">+R$ {Math.abs(pnl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  )}
                  {isLoss && (
                    <span className="ml-2 text-xs font-bold text-red-400">-R$ {Math.abs(pnl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{timeAgo(op.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


export default function AdminHome() {
  type AdminSummary = {
    joined: number;
    left: number;
    balance: number;
    accounts: number;
    accountsLast24h: number;
    transactions: number;
    operations_recents: number;
    last_five_operations?: LastOperation[];
  };

  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  function formatCurrencyBRL(value: number | null | undefined) {
    if (value == null || !Number.isFinite(Number(value))) return "--";
    return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }

  function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem('token'); } catch { return null; }
  }

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!api) return;
    let aborted = false;
    setLoadingSummary(true);
    (async () => {
      try {
        const resp = await fetch(`${api}/v1/admin/summary`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!resp.ok) return;
        const json = await resp.json().catch(() => null);
        if (!json?.status) return;
        const data = json?.data ?? {};
        if (!aborted) {
          setSummary({
            joined: Number(data?.joined ?? 0),
            left: Number(data?.left ?? 0),
            balance: Number(data?.balance ?? 0),
            accounts: Number(data?.accounts ?? 0),
            accountsLast24h: Number(data?.accountsLast24h ?? 0),
            transactions: Number(data?.transactions ?? 0),
            operations_recents: Number(data?.operations_recents ?? 0),
            last_five_operations: Array.isArray(data?.last_five_operations) ? (data.last_five_operations as LastOperation[]) : [],
          });
        }
      } finally {
        if (!aborted) setLoadingSummary(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  const balanceText = useMemo(() => {
    return summary ? formatCurrencyBRL(summary.balance) : (loadingSummary ? '...' : 'R$ 0,00');
  }, [summary, loadingSummary]);

  const accountsText = useMemo(() => {
    return summary ? summary.accounts.toLocaleString('pt-BR') : (loadingSummary ? '...' : '0');
  }, [summary, loadingSummary]);

  const transactionsText = useMemo(() => {
    return summary ? summary.transactions.toLocaleString('pt-BR') : (loadingSummary ? '...' : '0');
  }, [summary, loadingSummary]);

  const opsRecentText = useMemo(() => {
    return summary ? summary.operations_recents.toLocaleString('pt-BR') : (loadingSummary ? '...' : '0');
  }, [summary, loadingSummary]);

  return (
    <div className="flex bg-neutral-950 pt-[64px]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-2 flex flex-col gap-10 md:gap-12 max-w-7xl mx-auto w-full">
          <section>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Bem-vindo à Área Administrativa</h1>
            <p className="text-gray-300 max-w-2xl">
              Gerencie as operações da plataforma, visualize relatórios, controle usuários e acompanhe o desempenho financeiro em tempo real.
            </p>
          </section>
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard
                title="Saldo da Plataforma"
                value={balanceText}
                icon={<TrendingUp className="w-6 h-6 text-green-400" />}
                color="text-green-400 bg-green-900"
                description={summary ? `Entradas ${formatCurrencyBRL(summary.joined)} • Saídas ${formatCurrencyBRL(summary.left)}` : "Entradas • Saídas"}
              />
              <StatCard
                title="Contas"
                value={accountsText}
                icon={<Users className="w-6 h-6 text-blue-400" />}
                color="text-blue-400 bg-blue-900"
                description={summary ? `Novas 24h: ${summary.accountsLast24h.toLocaleString('pt-BR')}` : "Novas 24h"}
              />
              <StatCard
                title="Operações Recentes"
                value={opsRecentText}
                icon={<Activity className="w-6 h-6 text-yellow-400" />}
                color="text-yellow-400 bg-yellow-900"
                description="Operações nas últimas 24h"
              />
              <StatCard
                title="Transações"
                value={transactionsText}
                icon={<FileText className="w-6 h-6 text-purple-400" />}
                color="text-purple-400 bg-purple-900"
                description="Total de transações"
              />
            </div>
          </section>
          <section className="flex flex-col md:flex-row gap-6 mt-4">
            <div className="flex-1 flex flex-col gap-6">
              <RecentActivity items={summary?.last_five_operations || []} />
            </div>
            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow flex flex-col w-full">
                <h3 className="text-lg font-semibold text-white mb-4">Acesso Rápido</h3>
                <div className="flex flex-col gap-3">
                  <QuickLink
                    href="/app/admin/entradas"
                    icon={<TrendingUp className="w-5 h-5 text-green-300" />}
                    color="bg-green-600 hover:bg-green-700"
                  >
                    Ver Entradas
                  </QuickLink>
                  <QuickLink
                    href="/app/admin/saidas"
                    icon={<TrendingUp className="w-5 h-5 text-red-300 rotate-180" />}
                    color="bg-red-600 hover:bg-red-700"
                  >
                    Ver Saídas
                  </QuickLink>
                  <QuickLink
                    href="/app/admin/users"
                    icon={<Users className="w-5 h-5 text-blue-300" />}
                    color="bg-blue-600 hover:bg-blue-700"
                  >
                    Gerenciar Usuários
                  </QuickLink>
                  <QuickLink
                    href="/app/admin/reports"
                    icon={<FileText className="w-5 h-5 text-purple-300" />}
                    color="bg-purple-600 hover:bg-purple-700"
                  >
                    Relatórios
                  </QuickLink>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
