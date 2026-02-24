"use client";

import React, { useEffect, useMemo, useState } from "react";
import HeaderApp from "@/components/platform/headerapp";
import SidebarApp from "@/components/platform/sidebarapp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Users,
  Gift,
  BarChart2,
  Info,
  ArrowDownToLine,
  Calendar,
  User as UserIcon,
  DollarSign,
  Percent,
  TrendingUp,
  Coins,
  Receipt,
} from "lucide-react";

type AffiliateLog = {
  id: string;
  affiliateId: string;
  operationId: string;
  userId: string;
  userName: string;
  affiliateType: string; // e.g. DEPOSIT
  revenueType: string; // e.g. CPA
  amountBase: number;
  totalWin: number;
  createdAt: number; // epoch ms
};

type AffiliateData = {
  affiliateId: string;
  url: string;
  totalEarnings: number;
  availableBalance: number;
  cpa: number;
  percentPerDeposit: number;
  revshare: number;
  totalReferrals?: number;
  sub_affiliate_revenue?: number;
  logs: AffiliateLog[];
};

function formatCurrencyBRL(value: number) {
  const v = Number.isFinite(value) ? value : 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateTime(ts?: number) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString("pt-BR");
  } catch {
    return "-";
  }
}

function LogsTable({ logs }: { logs: AffiliateLog[] }) {
  const renderTypeBadge = (type?: string) => {
    const t = (type || "").toUpperCase();
    if (t === "DEPOSIT") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-900/60 text-green-400 text-xs border border-green-800">
          <ArrowDownToLine size={12} /> Depósito
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-gray-300 text-xs border border-neutral-700">
        <Receipt size={12} /> {t || "-"}
      </span>
    );
  };

  const renderRevenueBadge = (rev?: string) => {
    const r = (rev || "").toUpperCase();
    if (r === "CPA") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 text-xs border border-blue-800">
          <DollarSign size={12} /> CPA
        </span>
      );
    }
    if (r === "REVSHARE") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 text-xs border border-purple-800">
          <Percent size={12} /> RevShare
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-gray-300 text-xs border border-neutral-700">
        <Receipt size={12} /> {r || "-"}
      </span>
    );
  };

  return (
    <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow w-full overflow-x-auto">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Users size={18} className="text-green-400" />
        Atividades/Logs
      </h3>
      <table className="min-w-full text-sm text-gray-300">
        <thead>
          <tr className="border-b border-neutral-800/80">
            <th className="py-2 px-3 text-left text-gray-400 font-medium">Data</th>
            <th className="py-2 px-3 text-left text-gray-400 font-medium">Usuário</th>
            <th className="py-2 px-3 text-left text-gray-400 font-medium">Tipo</th>
            <th className="py-2 px-3 text-left text-gray-400 font-medium">Receita</th>
            <th className="py-2 px-3 text-right text-gray-400 font-medium">Base</th>
            <th className="py-2 px-3 text-right text-gray-400 font-medium">Ganho</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-6 text-center text-gray-500">
                Nenhum log encontrado.
              </td>
            </tr>
          ) : (
            logs.map((log) => {
              const rowAccent = (log.affiliateType || "").toUpperCase() === "DEPOSIT" ? "before:bg-green-700/60" : "before:bg-neutral-700/60";
              return (
                <tr
                  key={log.id}
                  className={`group border-b border-neutral-800 last:border-b-0 hover:bg-neutral-800/40 transition relative before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${rowAccent}`}
                >
                  <td className="py-2 px-3 whitespace-nowrap">
                    <div className="inline-flex items-center gap-2 text-gray-300">
                      <Calendar size={14} className="text-gray-500" />
                      <span>{formatDateTime(log.createdAt)}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                        <UserIcon size={14} className="text-gray-400" />
                      </div>
                      <span className="text-gray-200">{log.userName}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">{renderTypeBadge(log.affiliateType)}</td>
                  <td className="py-2 px-3">{renderRevenueBadge(log.revenueType)}</td>
                  <td className="py-2 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-gray-300">
                      <Coins size={14} className="text-amber-300/80" />
                      {formatCurrencyBRL(log.amountBase)}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className={`inline-flex items-center gap-1 font-semibold ${log.totalWin > 0 ? "text-green-400" : "text-gray-400"}`}>
                      <TrendingUp size={14} />
                      {formatCurrencyBRL(log.totalWin)}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AffiliateUserPage() {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) throw new Error("Não autenticado");
        const api = process.env.NEXT_PUBLIC_API_URL as string;
        const resp = await fetch(`${api}/v1/account/affiliate`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        let json: any = null;
        try { json = await resp.json(); } catch {}
        if (!json || json.status !== true) {
          const message = json?.message || "Falha ao carregar afiliado";
          throw new Error(message);
        }
        if (!ignore) setData(json.data as AffiliateData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar";
        setError(message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  const revshareLogs = useMemo(() => {
    const logs = data?.logs || [];
    return logs.filter((l) => String(l.revenueType || '').toUpperCase() === 'REVSHARE');
  }, [data?.logs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return revshareLogs;
    return revshareLogs.filter((l) =>
      (l.userName || "").toLowerCase().includes(q) ||
      (l.affiliateType || "").toLowerCase().includes(q) ||
      (l.revenueType || "").toLowerCase().includes(q)
    );
  }, [revshareLogs, search]);

  const handleCopy = () => {
    const link = data?.url || "";
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const revsharePercent = data?.revshare ?? 0;
  const comissaoLabel = `${revsharePercent}%`;

  const totalRevshare = useMemo(() => {
    return (revshareLogs || []).reduce((acc, l) => acc + (Number(l.totalWin) || 0), 0);
  }, [revshareLogs]);

  return (
    <>
      <HeaderApp />
      <div className="flex w-full bg-background min-h-screen">
        <SidebarApp />
        <main className="flex-1 flex flex-col items-center py-10 px-2">
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Gift size={32} className="text-green-400" />
              Programa de Afiliados
            </h1>
            <p className="text-gray-400 mb-8">
              Indique amigos e ganhe RevShare de <span className="text-green-400 font-semibold">{comissaoLabel}</span> sobre os lucros gerados pelos seus indicados.
            </p>

            {loading && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-gray-400 mb-8">
                Carregando dados do afiliado...
              </div>
            )}
            {error && (
              <div className="bg-red-950 border border-red-900 rounded-xl p-6 text-red-400 mb-8">
                {error}
              </div>
            )}

            {data && (
              <>
                {/* Estatísticas rápidas */}
                <section className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col items-center">
                    <BarChart2 size={28} className="text-green-400 mb-2" />
                    <span className="text-gray-400 text-xs">Ganhos Totais</span>
                    <span className="text-2xl font-bold text-green-400">{formatCurrencyBRL(totalRevshare)}</span>
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col items-center">
                    <ArrowUpRight size={28} className="text-white mb-2" />
                    <span className="text-gray-400 text-xs">Disponível para Saque</span>
                    <span className="text-2xl font-bold text-white">{formatCurrencyBRL(data.availableBalance)}</span>
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col items-center">
                    <Info size={28} className="text-yellow-400 mb-2" />
                    <span className="text-gray-400 text-xs">RevShare</span>
                    <span className="text-2xl font-bold text-white">{revsharePercent}%</span>
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col items-center">
                    <Users size={28} className="text-blue-400 mb-2" />
                    <span className="text-gray-400 text-xs">Contas Convidadas</span>
                    <span className="text-2xl font-bold text-white">{Number(data.totalReferrals || 0).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col items-center">
                    <Coins size={28} className="text-amber-300 mb-2" />
                    <span className="text-gray-400 text-xs">Receita Subafiliados</span>
                    <span className="text-2xl font-bold text-white">{formatCurrencyBRL(Number(data.sub_affiliate_revenue || 0))}</span>
                  </div>
                </section>

                {/* Link de indicação */}
                <section className="mb-8">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 w-full">
                      <div className="mb-2 text-gray-300 text-sm">Seu link de indicação:</div>
                      <div className="flex gap-2">
                        <Input
                          value={data.url}
                          readOnly
                          className="bg-neutral-800 border border-neutral-700 text-white font-mono"
                        />
                        <Button
                          onClick={handleCopy}
                          className="bg-green-700 hover:bg-green-800 text-white flex gap-1"
                          type="button"
                        >
                          {copied ? "Copiado!" : "Copiar"}
                          <ArrowUpRight size={16} />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Compartilhe este link para convidar amigos.
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[180px] w-full md:w-auto">
                      <div>
                        <span className="text-gray-400 text-xs">Código de Indicação</span>
                        <div className="text-lg font-bold text-white">{data.affiliateId}</div>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">RevShare</span>
                        <div className="text-lg font-bold text-green-400">{comissaoLabel}</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Logs */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Users size={20} className="text-green-400" />
                    Atividades/Logs
                    <span className="ml-2 text-xs text-gray-400 font-normal">({data.logs.length} no total)</span>
                  </h2>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar por usuário, tipo ou receita"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 text-white"
                      />
                    </div>
                  </div>
                  <LogsTable logs={filteredLogs} />
                </section>
              </>
            )}

            {/* Como funciona e dicas */}
            <section>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Info size={18} className="text-blue-400" />
                  Como funciona?
                </h3>
                <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1 mb-4">
                  <li>Compartilhe seu link de indicação com amigos.</li>
                  <li>Quando eles se cadastrarem e começarem a operar, você ganha RevShare.</li>
                  <li>O valor disponível para saque pode ser transferido para sua conta bancária.</li>
                </ul>
                <div className="bg-neutral-800 rounded-lg p-4 mt-2">
                  <span className="text-green-400 font-semibold">Dica:</span>{" "}
                  Quanto mais amigos você indicar, maior será seu potencial de ganhos!
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
