"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import HeaderApp from "@/components/platform/headerapp";
import SidebarApp from "@/components/platform/sidebarapp";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth";
import { toast } from "react-toastify";

type ApiHistoryItem = {
  id: string;
  accountId: string;
  pair: string;
  interval: string;
  arrow: "UP" | "DOWN" | string;
  bet: number;
  result: number; // retorno
  starredPrice: number;
  finishedPrice: number;
  status: "WIN" | "LOSE" | "DRAW" | string;
  createdAt: number; // epoch ms
  finishIn: number; // epoch ms
};

type UiHistoryItem = {
  id: string | number;
  ativo: string;
  direcao: "Compra" | "Venda";
  resultado: "Ganho" | "Perda" | "Empate";
  valor: number; // bet
  retorno: number; // result (retorno)
  data: string; // formatted
};

function getUniqueValues<T extends Record<string, any>, K extends keyof T>(
  array: T[],
  key: K
): T[K][] {
  return Array.from(new Set(array.map((item) => item[key])));
}

const ALL_ATIVO = "__all_ativo__";
const ALL_DIRECAO = "__all_direcao__";
const ALL_RESULTADO = "__all_resultado__";

export default function TradingHistoryPage() {
  // Filtros
  const [filtroAtivo, setFiltroAtivo] = useState<string>(ALL_ATIVO);
  const [filtroDirecao, setFiltroDirecao] = useState<string>(ALL_DIRECAO);
  const [filtroResultado, setFiltroResultado] = useState<string>(ALL_RESULTADO);

  const [rawHistory, setRawHistory] = useState<ApiHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setRawHistory([]);
        setLoading(false);
        return;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/account/history-trading`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.status === 401 || res.status === 403) {
        try { toast.info("Sessão expirada. Faça login novamente."); } catch {}
        await logout();
        return;
      }
      if (!res.ok) throw new Error("Falha ao carregar histórico");
      const json = await res.json();
      const data = Array.isArray(json?.data) ? (json.data as ApiHistoryItem[]) : [];
      setRawHistory(data);
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  function mapDirecao(arrow: string): UiHistoryItem["direcao"] {
    return arrow?.toUpperCase() === "UP" ? "Compra" : "Venda";
  }
  function mapResultado(status: string): UiHistoryItem["resultado"] {
    const s = (status || "").toUpperCase();
    if (s === "WIN") return "Ganho";
    if (s === "LOSE" || s === "LOSS") return "Perda";
    return "Empate";
  }
  function formatDate(ms: number): string {
    try { return new Date(ms).toLocaleString("pt-BR"); } catch { return "--"; }
  }

  const tradingHistory: UiHistoryItem[] = useMemo(() => {
    return rawHistory.map((h, idx) => ({
      id: h.id || idx,
      ativo: h.pair,
      direcao: mapDirecao(h.arrow),
      resultado: mapResultado(h.status),
      valor: Number(h.bet || 0),
      retorno: Number(h.result || 0),
      data: formatDate(Number(h.createdAt || 0)),
    }));
  }, [rawHistory]);

  // Opções únicas para filtros
  const ativos = useMemo(() => getUniqueValues(tradingHistory, "ativo"), [tradingHistory]);
  const direcoes = useMemo(() => getUniqueValues(tradingHistory, "direcao"), [tradingHistory]);
  const resultados = useMemo(() => getUniqueValues(tradingHistory, "resultado"), [tradingHistory]);

  // Filtragem dos trades
  const filteredHistory = useMemo(() => {
    return tradingHistory.filter((trade) => {
      const ativoOk = filtroAtivo !== ALL_ATIVO ? trade.ativo === filtroAtivo : true;
      const direcaoOk = filtroDirecao !== ALL_DIRECAO ? trade.direcao === filtroDirecao : true;
      const resultadoOk = filtroResultado !== ALL_RESULTADO ? trade.resultado === filtroResultado : true;
      return ativoOk && direcaoOk && resultadoOk;
    });
  }, [tradingHistory, filtroAtivo, filtroDirecao, filtroResultado]);

  const isAnyFilter =
    filtroAtivo !== ALL_ATIVO ||
    filtroDirecao !== ALL_DIRECAO ||
    filtroResultado !== ALL_RESULTADO;

  return (
    <>
      <HeaderApp />
      <div className="flex w-full bg-background">
        <SidebarApp />
        <main className="flex-1 flex flex-col items-center py-10 px-2">
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2 mb-6">
              Histórico de Trading
            </h1>
            <p className="text-gray-400 mb-2">Veja abaixo o histórico das suas operações realizadas na plataforma.</p>
            {error && (
              <div className="mb-4 text-sm text-red-400">{error}</div>
            )}
            {loading && (
              <div className="mb-4 text-sm text-gray-400">Carregando...</div>
            )}
            <div className="mb-6">
              <button
                type="button"
                onClick={fetchHistory}
                className="bg-neutral-800 hover:bg-neutral-700 text-gray-200 px-3 py-1 rounded text-sm"
              >
                Recarregar
              </button>
            </div>
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor="filtroAtivo">
                  Ativo
                </label>
                <Select
                  value={filtroAtivo}
                  onValueChange={setFiltroAtivo}
                >
                  <SelectTrigger className="w-36 bg-neutral-900 border border-neutral-800 text-gray-200 text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_ATIVO}>Todos</SelectItem>
                    {ativos.map((ativo) => (
                      <SelectItem key={String(ativo)} value={String(ativo)}>
                        {ativo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor="filtroDirecao">
                  Direção
                </label>
                <Select
                  value={filtroDirecao}
                  onValueChange={setFiltroDirecao}
                >
                  <SelectTrigger className="w-36 bg-neutral-900 border border-neutral-800 text-gray-200 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_DIRECAO}>Todas</SelectItem>
                    {direcoes.map((direcao) => (
                      <SelectItem key={String(direcao)} value={String(direcao)}>
                        {direcao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor="filtroResultado">
                  Resultado
                </label>
                <Select
                  value={filtroResultado}
                  onValueChange={setFiltroResultado}
                >
                  <SelectTrigger className="w-36 bg-neutral-900 border border-neutral-800 text-gray-200 text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_RESULTADO}>Todos</SelectItem>
                    {resultados.map((resultado) => (
                      <SelectItem key={String(resultado)} value={String(resultado)}>
                        {resultado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isAnyFilter && (
                <button
                  className="self-end mt-5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 px-4 py-2 rounded text-sm"
                  onClick={() => {
                    setFiltroAtivo(ALL_ATIVO);
                    setFiltroDirecao(ALL_DIRECAO);
                    setFiltroResultado(ALL_RESULTADO);
                  }}
                  type="button"
                >
                  Limpar filtros
                </button>
              )}
            </div>
            {/* Tabela responsiva: esconde a tabela em telas pequenas e mostra cards */}
            <div className="hidden sm:block overflow-x-auto rounded-xl shadow-md border border-neutral-800 bg-neutral-900">
              <table className="min-w-full divide-y divide-neutral-800">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ativo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Direção</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Retorno</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredHistory.map((trade) => (
                    <tr key={trade.id} className="hover:bg-neutral-800 transition">
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{trade.data}</td>
                      <td className="px-4 py-3 text-white font-semibold">{trade.ativo}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 ${trade.direcao === "Compra" ? "text-green-400" : "text-red-400"}`}>
                          {trade.direcao === "Compra" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                          {trade.direcao}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-200">R$ {trade.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className={`px-4 py-3 font-semibold ${trade.resultado === "Ganho" ? "text-green-400" : "text-red-400"}`}>
                        {trade.resultado === "Ganho"
                          ? `+R$ ${trade.retorno.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : `R$ 0,00`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${trade.resultado === "Ganho" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                          {trade.resultado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        Nenhuma operação encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Cards para mobile */}
            <div className="sm:hidden flex flex-col gap-4">
              {filteredHistory.length === 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center text-gray-400">
                  Nenhuma operação encontrada.
                </div>
              )}
              {filteredHistory.map((trade) => (
                <div
                  key={trade.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-2 shadow"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{trade.data}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        trade.resultado === "Ganho"
                          ? "bg-green-900 text-green-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {trade.resultado}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">{trade.ativo}</span>
                    <span
                      className={`flex items-center gap-1 text-sm ${
                        trade.direcao === "Compra" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {trade.direcao === "Compra" ? (
                        <ArrowUpRight size={15} />
                      ) : (
                        <ArrowDownRight size={15} />
                      )}
                      {trade.direcao}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Valor:</span>
                    <span className="text-gray-200">
                      R$ {trade.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Retorno:</span>
                    <span
                      className={`font-semibold ${
                        trade.resultado === "Ganho" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {trade.resultado === "Ganho"
                        ? `+R$ ${trade.retorno.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                        : "R$ 0,00"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col items-center">
              <span className="text-gray-400 text-sm">
                Continue operando para aumentar seu histórico de trades!
              </span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
