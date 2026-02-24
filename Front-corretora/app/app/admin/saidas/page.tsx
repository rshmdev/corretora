"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { TrendingDown, Users, FileText, Activity } from "lucide-react";

// shadcn UI imports
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Saida = {
  id: number;
  usuario: string;
  valor: string;
  data: string;
  status: "pendente" | "aprovada" | "rejeitada";
};
type AdminTransactionsResponse = {
  joined: number;
  joined_last_24h: number;
  left: number;
  left_last_24h: number;
  pending_transactions: Array<{
    id: string;
    accountId: string;
    reference: string;
    type: string;
    qrcode: string;
    amount: number;
    bonus: number;
    status: string;
    createAt: number;
    updateAt: number;
    user: string;
  }>;
  joined_transactions: Array<{
    id: string;
    accountId: string;
    reference: string;
    type: string;
    qrcode: string;
    amount: number;
    bonus: number;
    status: string;
    createAt: number;
    updateAt: number;
    user: string;
  }>;
  left_transactions: AdminTransactionsResponse["joined_transactions"];
};

function toBRL(value: number): string {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function mapStatus(apiStatus: string): Saida["status"] {
  const s = String(apiStatus || '').toUpperCase();
  if (s === 'APPROVED' || s === 'PAID' || s === 'DONE') return 'aprovada';
  if (s === 'PENDING' || s === 'PROCESSING') return 'pendente';
  return 'rejeitada';
}

function StatCard({
  title,
  value,
  icon,
  color,
  description,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}) {
  return (
    <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow flex flex-col items-start w-full">
      <div className="flex items-center gap-3 mb-2">
        <span className={`p-2 rounded-lg bg-opacity-20 ${color}`}>{icon}</span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <p className={`text-2xl font-bold`}>{value}</p>
      <span className="text-xs text-gray-400 mt-1">{description}</span>
    </div>
  );
}

function SaidasTable({ saidas }: { saidas: Saida[] }) {
  return (
    <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow w-full overflow-x-auto">
      <h3 className="text-lg font-semibold text-white mb-4">Saídas Recentes</h3>
      <table className="min-w-full text-sm text-gray-300">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className="py-2 px-3 text-left">Usuário</th>
            <th className="py-2 px-3 text-left">Valor</th>
            <th className="py-2 px-3 text-left">Data/Hora</th>
            <th className="py-2 px-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {saidas.map((saida) => (
            <tr key={saida.id} className="border-b border-neutral-800 last:border-b-0">
              <td className="py-2 px-3">{saida.usuario}</td>
              <td className="py-2 px-3 font-bold text-red-400">{saida.valor}</td>
              <td className="py-2 px-3">{saida.data}</td>
              <td className="py-2 px-3">
                {saida.status === "aprovada" && (
                  <span className="px-2 py-1 rounded bg-green-900 text-green-400 text-xs">Aprovada</span>
                )}
                {saida.status === "pendente" && (
                  <span className="px-2 py-1 rounded bg-yellow-900 text-yellow-400 text-xs">Pendente</span>
                )}
                {saida.status === "rejeitada" && (
                  <span className="px-2 py-1 rounded bg-red-900 text-red-400 text-xs">Rejeitada</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SaidasPage() {
  const [stats, setStats] = useState<{ totalSaidas: string; saidasHoje: string; saidasPendentes: string; usuariosComSaida: string }>({ totalSaidas: '--', saidasHoje: '--', saidasPendentes: '0', usuariosComSaida: '0' });
  const [saidas, setSaidas] = useState<Saida[]>([]);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [usuarioFilter, setUsuarioFilter] = useState<string>("");

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!token || !api) return;
    let aborted = false;
    (async () => {
      try {
        const resp = await fetch(`${api}/v1/admin/transactions`, { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) return;
        const json = await resp.json().catch(() => null);
        if (!json?.status) return;
        const data = json.data as AdminTransactionsResponse;
        if (aborted) return;
        const leftList = Array.isArray(data.left_transactions) ? data.left_transactions : [];
        const pendingList = Array.isArray(data.pending_transactions) ? data.pending_transactions : [];
        const saidasMapped: Saida[] = leftList.map((t, idx) => ({
          id: idx + 1,
          usuario: t.user || 'Usuário',
          valor: toBRL((t.amount || 0)),
          data: new Date(Number(t.createAt || 0)).toLocaleString('pt-BR'),
          status: mapStatus(t.status),
        }));
        const pendingDebit: Saida[] = pendingList
          .filter(p => String(p.type).toUpperCase() === 'DEBIT')
          .map((t, idx) => ({
            id: saidasMapped.length + idx + 1,
            usuario: t.user || 'Usuário',
            valor: toBRL((t.amount || 0)),
            data: new Date(Number(t.createAt || 0)).toLocaleString('pt-BR'),
            status: 'pendente',
          }));
        const uniqueUsers = new Set(leftList.map(t => t.user || 'Usuário')).size;
        setSaidas([...pendingDebit, ...saidasMapped]);
        setStats({
          totalSaidas: toBRL(data.left || 0),
          saidasHoje: toBRL(data.left_last_24h || 0),
          saidasPendentes: String(pendingList.filter(p => String(p.type).toUpperCase() === 'DEBIT').length),
          usuariosComSaida: String(uniqueUsers),
        });
      } catch {
      }
    })();
    return () => { aborted = true; };
  }, []);

  // Filtragem das saídas
  const saidasFiltradas = useMemo(() => {
    return saidas.filter((saida) => {
      const statusOk = statusFilter === "todos" ? true : saida.status === statusFilter;
      const usuarioOk = usuarioFilter.trim() === "" ? true : saida.usuario.toLowerCase().includes(usuarioFilter.trim().toLowerCase());
      return statusOk && usuarioOk;
    });
  }, [statusFilter, usuarioFilter, saidas]);

  return (
    <div className="flex bg-neutral-950 pt-[64px]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-2 flex flex-col gap-10 md:gap-12 max-w-7xl mx-auto w-full">
          <section>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Saídas</h1>
            <p className="text-gray-300 max-w-2xl">
              Visualize, gerencie e acompanhe todas as saídas de valores realizadas na plataforma.
            </p>
          </section>
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard
                title="Total de Saídas"
                value={stats.totalSaidas}
                icon={<TrendingDown className="w-6 h-6 text-red-400" />}
                color="text-red-400 bg-red-900"
                description="Saídas acumuladas"
              />
              <StatCard
                title="Saídas Hoje"
                value={stats.saidasHoje}
                icon={<TrendingDown className="w-6 h-6 text-red-300" />}
                color="text-red-300 bg-red-900"
                description="Saídas nas últimas 24h"
              />
              <StatCard
                title="Pendentes"
                value={stats.saidasPendentes}
                icon={<Activity className="w-6 h-6 text-yellow-400" />}
                color="text-yellow-400 bg-yellow-900"
                description="Saídas aguardando aprovação"
              />
              <StatCard
                title="Usuários com Saída"
                value={stats.usuariosComSaida}
                icon={<Users className="w-6 h-6 text-blue-400" />}
                color="text-blue-400 bg-blue-900"
                description="Usuários únicos"
              />
            </div>
          </section>
          {/* Filtros */}
          <section className="mt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Filtrar por usuário"
                  value={usuarioFilter}
                  onChange={(e) => setUsuarioFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
              <div className="w-full md:w-60">
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="bg-neutral-900 border border-neutral-800 text-white w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border border-neutral-800 text-white">
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="aprovada">Aprovada</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SaidasTable saidas={saidasFiltradas} />
          </section>
        </main>
      </div>
    </div>
  );
}
