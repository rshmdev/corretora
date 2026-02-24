"use client"
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Wallet, FlaskConical } from "lucide-react";
import HeaderApp from "@/components/platform/headerapp";
import SidebarApp from "@/components/platform/sidebarapp";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWs } from "@/context/ws/WsContext";
import { useAccount } from "@/context/account/AccountContext";
import { toast } from "react-toastify";

// Lista de criptomoedas disponíveis para operar
const CRYPTOS = [
  {
    label: "Bitcoin",
    value: "BTC/USDT",
    icon: "https://cryptofonts.com/img/icons/btc.svg",
    tradingViewSymbol: "BINANCE:BTCUSDT",
  },
  {
    label: "Ethereum",
    value: "ETH/USDT",
    icon: "https://cryptofonts.com/img/icons/eth.svg",
    tradingViewSymbol: "BINANCE:ETHUSDT",
  },
  {
    label: "Solana",
    value: "SOL/USDT",
    icon: "https://cryptofonts.com/img/icons/sol.svg",
    tradingViewSymbol: "BINANCE:SOLUSDT",
  },
  {
    label: "BNB",
    value: "BNB/USDT",
    icon: "https://cryptofonts.com/img/icons/bnb.svg",
    tradingViewSymbol: "BINANCE:BNBUSDT",
  },
  {
    label: "XRP",
    value: "XRP/USDT",
    icon: "https://cryptofonts.com/img/icons/xrp.svg",
    tradingViewSymbol: "BINANCE:XRPUSDT",
  },
  {
    label: "Chainlink",
    value: "LINK/USDT",
    icon: "https://cryptofonts.com/img/icons/link.svg",
    tradingViewSymbol: "BINANCE:LINKUSDT",
  },
  {
    label: "Avalanche",
    value: "AVAX/USDT",
    icon: "https://cryptofonts.com/img/icons/avax.svg",
    tradingViewSymbol: "BINANCE:AVAXUSDT",
  },
  {
    label: "Shiba Inu",
    value: "SHIB/USDT",
    icon: "https://cryptofonts.com/img/icons/shib.svg",
    tradingViewSymbol: "BINANCE:SHIBUSDT",
  },
  {
    label: "TRON",
    value: "TRX/USDT",
    icon: "https://cryptofonts.com/img/icons/trx.svg",
    tradingViewSymbol: "BINANCE:TRXUSDT",
  },
  {
    label: "Pepe",
    value: "PEPE/USDT",
    icon: "https://cryptofonts.com/img/icons/pepe.svg",
    tradingViewSymbol: "BINANCE:PEPEUSDT",
  },
];

export default function Home() {
  // Estado para moeda selecionada
  const [moeda, setMoeda] = useState(CRYPTOS[0].value);
  // Modo Demo/Real (sincronizado com Header via localStorage e evento)
  const [isDemo, setIsDemo] = useState<boolean>(false);

  // Investimento e tempo
  const [investimento, setInvestimento] = useState<number | "">("");
  const [tempo, setTempo] = useState<number | "">(1);
  // Supondo um retorno fixo de 80% para exemplo
  const retornoPercentual = 0.8;

  // Busca o objeto da moeda selecionada
  const moedaSelecionada = CRYPTOS.find((c) => c.value === moeda) || CRYPTOS[0];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const init = () => {
      const container = document.getElementById("tradingview_chart");
      if (!container) return;
      container.innerHTML = "";

      // @ts-ignore
      const tvWidget = new window.TradingView.widget({
        container_id: "tradingview_chart",
        autosize: true,
        symbol: moedaSelecionada.value.replace("/", ""),
        interval: "1",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "br",
        hide_top_toolbar: true,
        hide_side_toolbar: true,
        allow_symbol_change: false,
        hide_legend: true,
        withdateranges: false,
        studies: [],
        overrides: {
          "paneProperties.background": "#0b0e11",
          "paneProperties.vertGridProperties.color": "#0b0e11",
          "paneProperties.horzGridProperties.color": "#0b0e11",
          "paneProperties.legendProperties.showLegend": false,
          "scalesProperties.lineColor": "#46515e",
          "scalesProperties.textColor": "#9aa4b0",
          "mainSeriesProperties.candleStyle.upColor": "#22ab94",
          "mainSeriesProperties.candleStyle.downColor": "#f44336",
          "mainSeriesProperties.candleStyle.borderUpColor": "#22ab94",
          "mainSeriesProperties.candleStyle.borderDownColor": "#f44336",
          "mainSeriesProperties.candleStyle.wickUpColor": "#22ab94",
          "mainSeriesProperties.candleStyle.wickDownColor": "#f44336",
          "mainSeriesProperties.candleStyle.barColorsOnPrevClose": false,
        },
      });
      tvWidgetRef.current = tvWidget;
      try {
        // @ts-ignore
        if (tvWidget && typeof tvWidget.onChartReady === 'function') {
          // @ts-ignore
          tvWidget.onChartReady(() => {
            // Armazena a referência do chart quando estiver pronto
            try {
              // @ts-ignore
              const chart = typeof tvWidget.chart === 'function' ? tvWidget.chart() : (typeof tvWidget.activeChart === 'function' ? tvWidget.activeChart() : null);
              if (chart) {
                tvChartRef.current = chart;
                console.log('✅ Chart pronto e armazenado:', chart);
              }
            } catch (e) {
              console.error('Erro ao obter chart:', e);
            }

            if (typeof window !== "undefined" && window.innerWidth < 768 && !zoomAppliedRef.current) {
              zoomAppliedRef.current = true;
              try {
                // @ts-ignore
                const chart = typeof tvWidget.chart === 'function' ? tvWidget.chart() : (typeof tvWidget.activeChart === 'function' ? tvWidget.activeChart() : null);
                if (chart && typeof chart.executeActionById === 'function') {
                  const steps = 6;
                  for (let i = 0; i < steps; i++) {
                    setTimeout(() => {
                      try { chart.executeActionById('chartZoomIn'); } catch { }
                    }, 120 * i);
                  }
                }
              } catch { }
            }
          });
        }
      } catch { }
    };

    if (!(window as any).TradingView) {
      const script = document.createElement("script");
      script.id = "tv-widget-script";
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    } else {
      init();
    }

    return () => {
      const container = document.getElementById("tradingview_chart");
      if (container) container.innerHTML = "";
    };
  }, [moedaSelecionada.tradingViewSymbol]);

  // Inicializa e observa o modo Demo/Real
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('trade:demo');
      setIsDemo(raw === '1' || raw === 'true');
    } catch { }
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail;
        if (detail && typeof detail.demo === 'boolean') setIsDemo(detail.demo);
      } catch { }
    };
    window.addEventListener('app:trade-mode', handler as EventListener);
    return () => window.removeEventListener('app:trade-mode', handler as EventListener);
  }, []);

  // Atualiza modo e propaga globalmente
  const updateTradeMode = (demo: boolean) => {
    setIsDemo(demo);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('trade:demo', demo ? '1' : '0');
        const ev = new CustomEvent('app:trade-mode', { detail: { demo } });
        window.dispatchEvent(ev);
      } catch { }
    }
  };

  // Calcula o possível retorno
  const possivelRetorno =
    investimento && !isNaN(Number(investimento))
      ? Number(investimento) + Number(investimento) * retornoPercentual
      : 0;

  const { send, subscribe } = useWs();
  const { account } = useAccount();
  const unsubscribeBetsRef = useRef<(() => void) | null>(null);
  const zoomAppliedRef = useRef<boolean>(false);
  const tvWidgetRef = useRef<any>(null);
  const tvChartRef = useRef<any>(null); // Referência ao chart pronto

  type ActiveBet = {
    id: string;
    pair: string;
    arrow: 'UP' | 'DOWN';
    bet: number;
    intervalMinutes: number;
    createdAt: number; // epoch ms
    expiresAt: number; // epoch ms
    closed?: boolean;
    serverId?: string | number | null;
    entryPrice?: number; // Preço de entrada da operação
    lineId?: string; // ID da linha desenhada no gráfico
  };

  function normalizePair(p: string): string {
    return (p || "").replace(/\//g, "").toUpperCase();
  }

  const [activeBets, setActiveBets] = useState<ActiveBet[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [nowTs, setNowTs] = useState<number>(Date.now());

  // Carrega apostas ativas do localStorage ao montar o componente
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('active_bets');
      if (stored) {
        const parsed = JSON.parse(stored) as ActiveBet[];
        // Filtra apostas que ainda não expiraram
        const now = Date.now();
        const validBets = parsed.filter(bet => bet.expiresAt > now && !bet.closed);
        if (validBets.length > 0) {
          setActiveBets(validBets);
          console.log('✅ Apostas ativas carregadas do localStorage:', validBets.length);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar apostas do localStorage:', e);
    }
  }, []);

  // Salva apostas ativas no localStorage sempre que mudarem
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (activeBets.length > 0) {
        localStorage.setItem('active_bets', JSON.stringify(activeBets));
      } else {
        localStorage.removeItem('active_bets');
      }
    } catch (e) {
      console.error('Erro ao salvar apostas no localStorage:', e);
    }
  }, [activeBets]);

  useEffect(() => {
    const iv = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Subscreve aos preços das moedas das apostas ativas
  useEffect(() => {
    if (activeBets.length === 0) return;

    const unsubscribers: (() => void)[] = [];
    const pairs = Array.from(new Set(activeBets.map(b => normalizePair(b.pair))));
    console.log('Subscrevendo aos pares:', pairs);
    pairs.forEach(pair => {
      const destination = `/topic/klines/${pair}/1m`;
      const un = subscribe(destination, (msg) => {
        console.log('✅ Preço recebido para', pair);
        try {
          console.log('✅ Preço recebido para', pair);
          const payload = JSON.parse(msg.body);
          if (payload && payload.close) {
            console.log('✅ Preço recebido para', payload);
            setPrices(prev => ({ ...prev, [pair]: payload.close }));
          }
        } catch (e) { }
      });
      unsubscribers.push(un);
    });

    return () => unsubscribers.forEach(un => un());
  }, [activeBets, subscribe]);

  // Subscreve ao preço do par atualmente selecionado para ter o preço pronto no momento da aposta
  useEffect(() => {
    if (!moeda) return;
    const pair = normalizePair(moeda);
    const destination = `/topic/klines/${pair}/1m`;
    const un = subscribe(destination, (msg) => {
      try {
        const payload = JSON.parse(msg.body);
        if (payload && payload.close) {
          setPrices(prev => ({ ...prev, [pair]: payload.close }));
        }
      } catch (e) { }
    });
    return () => un?.();
  }, [moeda, subscribe]);

  useEffect(() => {
    // Remove expiradas e fechadas
    setActiveBets((prev) => {
      const toRemove = prev.filter((b) => b.closed || b.expiresAt <= nowTs);

      // Se não há apostas para remover, retorna o estado anterior sem mudanças
      if (toRemove.length === 0) return prev;

      // Remove as linhas do gráfico
      if (tvWidgetRef.current && toRemove.length > 0) {
        try {
          const chart = typeof tvWidgetRef.current.chart === 'function'
            ? tvWidgetRef.current.chart()
            : (typeof tvWidgetRef.current.activeChart === 'function'
              ? tvWidgetRef.current.activeChart()
              : null);
          if (chart) {
            toRemove.forEach((bet) => {
              if (bet.lineId) {
                try {
                  chart.removeEntity(bet.lineId);
                } catch (e) {
                  console.debug('Erro ao remover linha:', e);
                }
              }
            });
          }
        } catch (e) {
          console.debug('Erro ao acessar chart:', e);
        }
      }

      // Retorna apenas apostas válidas (não fechadas e não expiradas)
      const validBets = prev.filter((b) => !b.closed && b.expiresAt > nowTs);
      console.log(`🗑️ Removendo ${toRemove.length} aposta(s) expirada(s)/fechada(s)`);
      return validBets;
    });
  }, [nowTs]);

  function getAccountId(source: Record<string, any> | null | undefined): string | null {
    if (!source) return null;
    const candidates = [
      (source as any)?.accountId,
      (source as any)?.account_id,
      (source as any)?.id,
      (source as any)?.uuid,
    ];
    const found = candidates.find((v) => typeof v === "string" || typeof v === "number");
    return found != null ? String(found) : null;
  }

  const accountId = useMemo(() => getAccountId(account as any), [account]);

  function parseNumber(value: any): number | null {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function extractId(payload: any): string | number | null {
    const candidates = [
      payload?.id,
      payload?.betId,
      payload?.bet_id,
      payload?.uuid,
      payload?.externalId,
      payload?.external_id,
    ];
    const found = candidates.find((v) => typeof v === 'string' || typeof v === 'number');
    return found ?? null;
  }

  function extractCreatedAtMs(payload: any): number | null {
    const candidates = [
      payload?.createdAt,
      payload?.created_at,
      payload?.timestamp,
      payload?.ts,
      payload?.openAt,
      payload?.open_at,
      payload?.startedAt,
      payload?.started_at,
    ];
    for (const v of candidates) {
      const num = Number(v);
      if (Number.isFinite(num)) {
        // Heurística: se for menor que 10^12, pode estar em segundos
        return num > 1e12 ? num : num * 1000;
      }
      if (typeof v === 'string') {
        const t = Date.parse(v);
        if (!Number.isNaN(t)) return t;
      }
    }
    return null;
  }

  function extractIntervalMinutes(value: any): number | null {
    if (value == null) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const s = String(value).trim().toLowerCase();
    const match = s.match(/(\d+)(m|min|mins|minute|minutes)?/);
    if (match) return Number(match[1]);
    return null;
  }

  function isBetClosed(payload: any): boolean {
    const status = String(payload?.status ?? '').toLowerCase();
    if (
      [
        'closed', 'finished', 'settled', 'ended', 'completed', 'done', 'paid', 'expired',
        'win', 'won', 'loss', 'lose', 'lost', 'draw', 'canceled', 'cancelled'
      ].includes(status)
    ) return true;
    if (payload?.closed === true || payload?.isClosed === true) return true;
    if (typeof payload?.result === 'string') return true;
    return false;
  }

  function extractProfit(payload: any): number | null {
    const directKeys = ['result', 'profit', 'pnl', 'pnlValue', 'net', 'netProfit'];
    for (const k of directKeys) {
      const v = parseNumber(payload?.[k]);
      if (v !== null) return v;
    }
    const betAmount = parseNumber(payload?.bet ?? payload?.amount ?? payload?.stake);
    const payout = parseNumber(payload?.payout ?? payload?.return ?? payload?.payoutAmount ?? payload?.received ?? payload?.gross);
    if (betAmount !== null && payout !== null) return payout - betAmount;
    return null;
  }

  function extractResult(payload: any): 'win' | 'loss' | 'draw' | null {
    const resultStr = String(payload?.result ?? '').toLowerCase();
    if (['win', 'won', 'success', 'green'].includes(resultStr)) return 'win';
    if (['loss', 'lose', 'failed', 'red'].includes(resultStr)) return 'loss';
    if (['draw', 'tie', 'equal'].includes(resultStr)) return 'draw';
    if (payload?.won === true) return 'win';
    if (payload?.won === false) return 'loss';
    const statusStr = String(payload?.status ?? '').toLowerCase();
    if (['win', 'won', 'success', 'green'].includes(statusStr)) return 'win';
    if (['loss', 'lose', 'lost', 'failed', 'red'].includes(statusStr)) return 'loss';
    if (['draw', 'tie', 'equal'].includes(statusStr)) return 'draw';
    return null;
  }

  function formatCurrencyBRL(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(Number(value))) return '--';
    return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }

  function buildBetToastMessage(payload: any, profit: number | null, result: 'win' | 'loss' | 'draw' | null): string {
    function resolveOutcomeLabel(p: any, pProfit: number | null, pResult: 'win' | 'loss' | 'draw' | null): string {
      if (pResult) return pResult.toUpperCase();
      const statusStr = String(p?.status ?? '').toUpperCase();
      if (['WIN', 'LOSS', 'DRAW'].includes(statusStr)) return statusStr;
      if (pProfit != null) return pProfit > 0 ? 'WIN' : pProfit < 0 ? 'LOSS' : 'DRAW';
      return '';
    }

    const pair = payload?.pair ?? '';
    const interval = payload?.interval ?? '';
    const arrow = payload?.arrow ?? '';
    const bet = parseNumber(payload?.bet);
    const entry = parseNumber(payload?.starredPrice);
    const exit = parseNumber(payload?.finishedPrice);
    const betStr = formatCurrencyBRL(bet ?? null);
    const entryStr = entry != null ? entry.toLocaleString('pt-BR') : '--';
    const exitStr = exit != null ? exit.toLocaleString('pt-BR') : '--';
    const headerBase = `${pair} ${interval} | ${arrow}`.trim();
    const outcome = resolveOutcomeLabel(payload, profit, result);
    const header = outcome ? `[${outcome}] ${headerBase}` : headerBase;
    if (profit != null) {
      const pnlStr = formatCurrencyBRL(Math.abs(profit));
      const dir = profit > 0 ? 'Lucro' : profit < 0 ? 'Prejuízo' : 'Sem lucro/prejuízo';
      return `${header} • Aposta ${betStr} • Entrada ${entryStr} → Saída ${exitStr} • ${dir} ${profit === 0 ? '' : pnlStr}`.trim();
    }
    if (result) {
      const dir = result === 'win' ? 'Lucro' : result === 'loss' ? 'Prejuízo' : 'Sem lucro/prejuízo';
      return `${header} • Aposta ${betStr} • Entrada ${entryStr} → Saída ${exitStr} • ${dir}`.trim();
    }
    return `${header} • Aposta ${betStr} • Entrada ${entryStr} → Saída ${exitStr}`.trim();
  }

  useEffect(() => {
    if (!accountId) return;
    try { unsubscribeBetsRef.current?.(); } catch { }
    const destination = `/topic/bets/${accountId}`;
    const un = subscribe(destination, (msg) => {
      try {
        const payload = msg.body ? JSON.parse(msg.body) : null;
        if (payload && typeof payload === "object") {
          const status = (payload as any)?.status;
          console.log('🔵 WS bet recebido | status:', status, '| keys:', Object.keys(payload));
          if (String(status).toLowerCase() === "error") {
            try {
              setActiveBets((prev) => {
                const pairRaw = (payload as any)?.pair ?? "";
                const arrowRaw = String((payload as any)?.arrow ?? "").toUpperCase();
                const minutes = extractIntervalMinutes((payload as any)?.interval);
                const pairNorm = String(pairRaw).replace(/\//g, "");
                const nowMs = Date.now();
                let removed = false;
                const next = prev.filter((b) => {
                  if (removed) return true;
                  // mantém apostas que já possuem id do servidor
                  if (b.serverId != null) return true;
                  // chave aproximada: par/seta/intervalo e janela de tempo recente (10s)
                  if (pairNorm && b.pair.replace(/\//g, "") !== pairNorm) return true;
                  if (arrowRaw && b.arrow !== (arrowRaw === "DOWN" ? "DOWN" : "UP")) return true;
                  if (minutes != null && b.intervalMinutes !== minutes) return true;
                  if (Math.abs(nowMs - b.createdAt) > 10_000) return true;
                  removed = true;
                  return false; // remove a primeira aposta local correspondente
                });
                // Fallback: se nada removido por chave, remove a aposta local mais recente (<=10s)
                if (!removed) {
                  let idx = -1;
                  for (let i = 0; i < next.length; i++) {
                    const b = next[i];
                    if (b.serverId == null && (nowMs - b.createdAt) <= 10_000) {
                      idx = i;
                      break;
                    }
                  }
                  if (idx >= 0) {
                    const copy = next.slice();
                    copy.splice(idx, 1);
                    return copy;
                  }
                }
                return next;
              });
            } catch { }
            toast.error((payload as any)?.message || "Erro ao processar a aposta");
            return;
          } else if (String(status).toLowerCase() === "ok") {
            toast.success((payload as any)?.message || "Aposta enviada com sucesso");
          } else {
            // Resultado da aposta quando fechada
            if (isBetClosed(payload)) {
              const serverId = extractId(payload);
              // Marca como fechada/Remove da lista
              setActiveBets((prev) => prev.filter((b) => {
                if (b.serverId != null && serverId != null) {
                  return String(b.serverId) !== String(serverId);
                }
                // Fallback: casar por par/seta/intervalo em janela de tempo
                const pair = normalizePair(payload?.pair ?? '');
                const arrow = String(payload?.arrow ?? '').toUpperCase();
                const minutes = extractIntervalMinutes(payload?.interval) ?? null;
                if (!pair || !arrow || minutes == null) return true;
                const isSameKey = normalizePair(b.pair) === pair && b.arrow === (arrow === 'DOWN' ? 'DOWN' : 'UP') && b.intervalMinutes === minutes;
                if (!isSameKey) return true;
                // Se abrir/fechar muito distante, mantém
                const createdAtMs = extractCreatedAtMs(payload);
                if (createdAtMs != null && Math.abs(b.createdAt - createdAtMs) > 60_000) return true;
                return false;
              }));
              const profit = extractProfit(payload);
              const result = extractResult(payload);
              const message = buildBetToastMessage(payload, profit, result);
              if (profit != null) {
                if (profit > 0) toast.success(message);
                else if (profit < 0) toast.error(message);
                else toast.info(message);
              } else if (result) {
                if (result === 'win') toast.success(message);
                else if (result === 'loss') toast.error(message);
                else toast.info(message);
              } else {
                toast.info(message);
              }
            } else {
              // Aposta aberta/atualização: mantém/insere na lista de ativas
              const serverId = extractId(payload);
              const pair = (payload?.pair ?? moeda).toString();
              const arrow = String(payload?.arrow ?? '').toUpperCase() === 'DOWN' ? 'DOWN' : 'UP';
              const betAmount = parseNumber(payload?.bet ?? payload?.amount) ?? 0;
              const serverEntryPrice = parseNumber(payload?.starredPrice ?? payload?.entryPrice ?? payload?.entry_price);
              const minutes = extractIntervalMinutes(payload?.interval) ?? extractIntervalMinutes(tempo) ?? 1;
              const createdAt = extractCreatedAtMs(payload) ?? Date.now();
              const expiresAt = (() => {
                const explicit = Number(payload?.expiresAt ?? payload?.expires_at ?? payload?.closeAt ?? payload?.close_at);
                if (Number.isFinite(explicit)) return explicit > 1e12 ? explicit : explicit * 1000;
                return createdAt + minutes * 60_000;
              })();

              setActiveBets((prev) => {
                let updated = false;
                // Find the most recently created unconfirmed bet for this pair+arrow (to match even 
                // when client/server clocks differ)
                const candidateLocalBet = prev
                  .filter(b => b.serverId == null && normalizePair(b.pair) === normalizePair(pair) && b.arrow === arrow)
                  .sort((a, b) => b.createdAt - a.createdAt)[0];
                console.log('🟡 matching | prev.length:', prev.length, '| pair:', pair, '| arrow:', arrow, '| candidate:', candidateLocalBet?.id ?? 'NOT FOUND');

                const next = prev.map((b) => {
                  // Se já existe por serverId
                  const isSameServer = serverId != null && b.serverId != null && String(b.serverId) === String(serverId);
                  // Ou é a aposta local mais recente sem confirmação para este par/seta
                  const isMatchingLocal = candidateLocalBet != null && b.id === candidateLocalBet.id;

                  if (isSameServer || isMatchingLocal) {
                    updated = true;
                    let lineId = b.lineId;
                    // Se recebemos o preço do servidor e ainda não tínhamos no gráfico, tentamos desenhar
                    if (serverEntryPrice && !lineId && tvChartRef.current) {
                      lineId = drawLineOnChart(tvChartRef.current, arrow as "UP" | "DOWN", serverEntryPrice);
                    }

                    return {
                      ...b,
                      pair,
                      arrow: arrow as 'UP' | 'DOWN',
                      bet: betAmount || b.bet,
                      intervalMinutes: minutes,
                      createdAt: createdAt || b.createdAt,
                      expiresAt,
                      serverId: serverId ?? b.serverId,
                      entryPrice: serverEntryPrice ?? b.entryPrice,
                      lineId
                    };
                  }
                  return b;
                });

                if (updated) return next;

                // Nova aposta do servidor
                let lineId: string | undefined;
                if (serverEntryPrice && tvChartRef.current) {
                  lineId = drawLineOnChart(tvChartRef.current, arrow as "UP" | "DOWN", serverEntryPrice);
                }

                const newItem: ActiveBet = {
                  id: `srv-${serverId ?? 'tmp'}-${createdAt}`,
                  serverId,
                  pair,
                  arrow: arrow as 'UP' | 'DOWN',
                  bet: betAmount,
                  intervalMinutes: minutes,
                  createdAt,
                  expiresAt,
                  entryPrice: serverEntryPrice ?? undefined,
                  lineId
                };

                return [newItem, ...prev].slice(0, 50);
              });
            }
          }
        }
      } catch (e) {
        console.debug("Bet update error:", e);
      }
    });
    unsubscribeBetsRef.current = un;
    return () => { try { unsubscribeBetsRef.current?.(); } catch { } };
  }, [accountId, subscribe]);

  // Função auxiliar para desenhar a linha no gráfico (sem efeitos colaterais de estado)
  const drawLineOnChart = (chart: any, arrow: "UP" | "DOWN", price: number): string | undefined => {
    try {
      const lineColor = arrow === "UP" ? "#22c55e" : "#ef4444";
      const currentTime = Math.floor(Date.now() / 1000);
      return chart.createShape?.(
        { time: currentTime, price },
        {
          shape: 'horizontal_line',
          overrides: {
            linecolor: lineColor,
            linewidth: 2,
            linestyle: 2,
            showLabel: true,
            textcolor: lineColor,
          },
          text: `${arrow === 'UP' ? 'COMPRA' : 'VENDA'} @ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          lock: true,
          disableSelection: true,
          disableSave: true,
          disableUndo: true,
        }
      );
    } catch (e) {
      console.error('Erro ao desenhar linha:', e);
      return undefined;
    }
  };

  const enviarAposta = (arrow: "UP" | "DOWN") => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const pair = (moeda || "BTC/USDT").replace("/", "");
    const bet = Number(investimento);
    if (!bet || Number.isNaN(bet) || bet <= 0) return;
    const interval = typeof tempo === "number" ? `${tempo}m` : (tempo ? String(tempo) : "1m");
    const payload = { pair, bet, interval, arrow, token, demo: Boolean(isDemo) };
    send("/app/bet", JSON.stringify(payload));

    // Adiciona localmente apenas para feedback imediato visual (o servidor confirmará depois)
    const createdAt = Date.now();
    const minutes = typeof tempo === 'number' ? tempo : 1;
    const expiresAt = createdAt + minutes * 60_000;
    const localId = `client-${createdAt}-${Math.random().toString(36).slice(2, 8)}`;
    // Captura o preço atual no momento do clique como entrada temporária
    const normalizedPairNow = normalizePair(moeda);
    const localEntryPrice = prices[normalizedPairNow] ?? undefined;

    setActiveBets((prev) => [
      {
        id: localId,
        pair: moeda,
        arrow,
        bet,
        intervalMinutes: minutes,
        createdAt,
        expiresAt,
        entryPrice: localEntryPrice,
      },
      ...prev,
    ]);
  };

  const cashout = (bet: ActiveBet) => {
    if (!bet.serverId) {
      toast.error("Operação ainda não confirmada no servidor");
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    send("/app/cashout", JSON.stringify({ betId: bet.serverId, token }));
  };

  return (
    <>
      <HeaderApp
        cryptoOptions={CRYPTOS}
        selectedCryptoValue={moeda}
        onChangeCrypto={setMoeda}
      />
      <div className="flex">
        <SidebarApp />
        <main
          className="flex-1 min-h-[calc(100vh-64px)] md:ml-24"
        >
          <div className="flex h-[calc(100vh-64px)] w-full">
            {/* Gráfico de operações centralizado */}
            <div className="flex-1 flex items-center justify-center bg-neutral-950">
              <div className="w-full h-[100%] flex items-center justify-center">
                <div
                  id="tradingview_chart"
                  className="h-full w-full"
                  style={{
                    minHeight: 480,
                    background: "#18181b",
                    border: "none",
                  }}
                />
              </div>
            </div>

            <div className="hidden md:flex w-[340px] min-w-[300px] max-w-[400px] bg-background border-l border-neutral-800 flex-col justify-between p-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">
                  Negociação
                </h2>
                {/* Selecionar a moeda para operar */}
                <div className="mb-4">
                  <label
                    className="block text-gray-300 mb-1"
                    htmlFor="moeda-select"
                  >
                    Selecione a criptomoeda:
                  </label>
                  <Select
                    value={moeda}
                    onValueChange={setMoeda}
                  >
                    <SelectTrigger
                      id="moeda-select"
                      className="w-full rounded-md bg-neutral-800 text-gray-200 px-3 py-2 focus:outline-none"
                    >
                      <SelectValue
                        placeholder="Selecione a moeda"
                        className="flex items-center"
                      >
                        {moedaSelecionada && (
                          <span className="flex items-center">
                            <img
                              src={moedaSelecionada.icon}
                              alt={moedaSelecionada.label}
                              className="w-5 h-5 mr-2"
                              style={{
                                background: "#fff",
                                borderRadius: "50%",
                              }}
                            />
                            {moedaSelecionada.value}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Criptomoedas</SelectLabel>
                        {CRYPTOS.map((crypto) => (
                          <SelectItem key={crypto.value} value={crypto.value}>
                            <span className="flex items-center">
                              <img
                                src={crypto.icon}
                                alt={crypto.label}
                                className="w-5 h-5 mr-2"
                                style={{
                                  background: "#fff",
                                  borderRadius: "50%",
                                }}
                              />
                              {crypto.value}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                {/* Mostra a moeda selecionada */}
                <div className="mb-4 flex items-center">
                  <span className="text-gray-400 text-sm">
                    Moeda selecionada:
                  </span>
                  <span className="ml-2 flex items-center font-bold text-white">
                    <img
                      src={moedaSelecionada.icon}
                      alt={moedaSelecionada.label}
                      className="w-5 h-5 mr-2"
                      style={{ background: "#fff", borderRadius: "50%" }}
                    />
                    {moedaSelecionada.value}
                  </span>
                </div>
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div>
                    <label
                      className="block text-gray-300 mb-1"
                      htmlFor="tempo"
                    >
                      Tempo
                    </label>
                    {/* Usando o Select do shadcn */}
                    <Select
                      value={String(tempo)}
                      onValueChange={(v) => setTempo(Number(v))}
                    >
                      <SelectTrigger className="w-full rounded-md bg-neutral-800 text-gray-200 px-3 py-2 focus:outline-none">
                        <SelectValue placeholder="Selecione o tempo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>


                  <div>
                    <label
                      className="block text-gray-300 mb-1"
                      htmlFor="investimento"
                    >
                      Investimento
                    </label>
                    <input
                      id="investimento"
                      type="number"
                      min="0"
                      step="any"
                      className="w-full rounded-md bg-neutral-800 text-gray-200 px-3 py-2 focus:outline-none"
                      placeholder="R$"
                      value={investimento}
                      onChange={(e) =>
                        setInvestimento(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  {/* Mostra o possível retorno */}
                  <div className="bg-neutral-900 rounded-md p-3 text-gray-200 flex flex-col gap-1">
                    <span className="text-xs text-gray-400">
                      Possível retorno:
                    </span>
                    <span className="text-lg font-semibold text-green-400">
                      {investimento && !isNaN(Number(investimento))
                        ? `R$ ${possivelRetorno.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}`
                        : "--"}
                    </span>
                    <span className="text-xs text-gray-400">
                      Retorno estimado de 80%
                    </span>
                  </div>
                  <button
                    type="button"
                    className="w-full bg-gradient-to-tr from-green-500 to-green-400 text-white font-semibold py-2 rounded-md mt-2 hover:from-green-600 hover:to-green-500 transition"
                    onClick={() => enviarAposta("UP")}
                  >
                    Comprar
                  </button>
                  <button
                    type="button"
                    className="w-full bg-gradient-to-tr from-red-500 to-pink-500 text-white font-semibold py-2 rounded-md hover:from-red-600 hover:to-pink-600 transition"
                    onClick={() => enviarAposta("DOWN")}
                  >
                    Vender
                  </button>
                </form>
                {/* Operações ativas (desktop) */}
                {activeBets.filter((b) => !b.closed && b.expiresAt > nowTs).length > 0 && (
                  <div className="mt-4 bg-neutral-900 rounded-md p-3">
                    <div className="text-gray-300 text-sm mb-2">Operações ativas</div>
                    <div className="space-y-2">
                      {activeBets
                        .filter((b) => !b.closed && b.expiresAt > nowTs)
                        .sort((a, b) => a.expiresAt - b.expiresAt)
                        .map((b) => {
                          const remainingMs = Math.max(0, b.expiresAt - nowTs);
                          const remSec = Math.floor(remainingMs / 1000);
                          const mm = String(Math.floor(remSec / 60)).padStart(2, '0');
                          const ss = String(remSec % 60).padStart(2, '0');

                          const normalizedPair = normalizePair(b.pair || "");
                          const currentPrice = prices[normalizedPair];
                          // usa preço do servidor se confirmado, senão usa preço atual como fallback temporário
                          const effectiveEntryPrice = b.entryPrice ?? currentPrice;
                          // Fator de amplificação visual — as moedas se movem pouco em curtos períodos,
                          // então multiplicamos para tornar o P/L mais expressivo na tela
                          const PNL_DISPLAY_MULTIPLIER = 50;
                          let pnlPercent = 0;
                          let isWinning = false;

                          if (currentPrice && effectiveEntryPrice) {
                            if (b.arrow === 'UP') {
                              isWinning = currentPrice > effectiveEntryPrice;
                              pnlPercent = ((currentPrice - effectiveEntryPrice) / effectiveEntryPrice) * 100 * PNL_DISPLAY_MULTIPLIER;
                            } else {
                              isWinning = currentPrice < effectiveEntryPrice;
                              pnlPercent = ((effectiveEntryPrice - currentPrice) / effectiveEntryPrice) * 100 * PNL_DISPLAY_MULTIPLIER;
                            }
                          }

                          return (
                            <div key={b.id} className="flex flex-col gap-1 border-b border-neutral-800 pb-2 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between text-gray-200 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className={b.arrow === 'UP' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                    {b.arrow === 'UP' ? '↑' : '↓'}
                                  </span>
                                  <span>{b.pair}</span>
                                  <span className="text-gray-400">{formatCurrencyBRL(b.bet)}</span>
                                </div>
                                <span className="font-mono text-xs bg-neutral-800 px-1.5 py-0.5 rounded text-gray-400">{mm}:{ss}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-gray-500">Entrada: {effectiveEntryPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '--'}{b.entryPrice && !b.serverId ? ' ~' : ''}</span>
                                <div className="flex items-center gap-2">
                                  <span className={isWinning ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                    {isWinning ? '+' : ''}{pnlPercent.toFixed(2)}%
                                  </span>
                                  {(() => {
                                    // Mesmo cálculo do backend: aposta ± aposta × pnlExibido%
                                    const cashoutAmount = isWinning
                                      ? b.bet + b.bet * (pnlPercent / 100)
                                      : Math.max(0, b.bet - b.bet * (pnlPercent / 100));
                                    return (
                                      <button
                                        onClick={() => cashout(b)}
                                        className={`px-1.5 py-0.5 rounded text-[9px] transition border font-semibold ${isWinning
                                          ? 'bg-green-900/40 hover:bg-green-800/60 text-green-300 border-green-700/50'
                                          : 'bg-red-900/40 hover:bg-red-800/60 text-red-300 border-red-700/50'
                                          }`}
                                      >
                                        {cashoutAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                      </button>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Mobile (menu inferior fixo) */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-neutral-800 flex flex-col md:hidden p-3">
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="flex items-center gap-2">
                  <Select
                    value={moeda}
                    onValueChange={setMoeda}
                  >
                    <SelectTrigger
                      id="moeda-select-mobile"
                      className="flex-1 rounded-md bg-neutral-800 text-gray-200 px-2 py-1 focus:outline-none"
                    >
                      <SelectValue
                        placeholder="Moeda"
                        className="flex items-center"
                      >
                        {moedaSelecionada && (
                          <span className="flex items-center">
                            <img
                              src={moedaSelecionada.icon}
                              alt={moedaSelecionada.label}
                              className="w-5 h-5 mr-1"
                              style={{
                                background: "#fff",
                                borderRadius: "50%",
                              }}
                            />
                            {moedaSelecionada.value}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Criptomoedas</SelectLabel>
                        {CRYPTOS.map((crypto) => (
                          <SelectItem key={crypto.value} value={crypto.value}>
                            <span className="flex items-center">
                              <img
                                src={crypto.icon}
                                alt={crypto.label}
                                className="w-5 h-5 mr-1"
                                style={{
                                  background: "#fff",
                                  borderRadius: "50%",
                                }}
                              />
                              {crypto.value}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(tempo)}
                    onValueChange={(v) => setTempo(Number(v))}
                  >
                    <SelectTrigger className="w-20 rounded-md bg-neutral-800 text-gray-200 px-2 py-1 focus:outline-none">
                      <SelectValue placeholder="Tempo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={isDemo ? 'demo' : 'real'}
                    onValueChange={(v) => updateTradeMode(v === 'demo')}
                  >
                    <SelectTrigger className="w-28 rounded-md bg-neutral-800 text-gray-200 px-2 py-1 focus:outline-none">
                      <SelectValue placeholder="Modo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real">
                        <span className="flex items-center"><Wallet className="w-4 h-4 mr-1" /> Real</span>
                      </SelectItem>
                      <SelectItem value="demo">
                        <span className="flex items-center"><FlaskConical className="w-4 h-4 mr-1" /> Demo</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    id="investimento-mobile"
                    type="number"
                    min="0"
                    step="any"
                    className="w-24 rounded-md bg-neutral-800 text-gray-200 px-2 py-1 focus:outline-none"
                    placeholder="R$"
                    value={investimento}
                    onChange={(e) =>
                      setInvestimento(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </div>
                {/* Possível retorno e botões */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">
                      Retorno:
                    </span>
                    <span className="text-sm font-semibold text-green-400">
                      {investimento && !isNaN(Number(investimento))
                        ? `R$ ${possivelRetorno.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}`
                        : "--"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="bg-gradient-to-tr from-green-500 to-green-400 text-white font-semibold px-3 py-1 rounded-md text-sm hover:from-green-600 hover:to-green-500 transition"
                      onClick={() => enviarAposta("UP")}
                    >
                      Comprar
                    </button>
                    <button
                      type="button"
                      className="bg-gradient-to-tr from-red-500 to-pink-500 text-white font-semibold px-3 py-1 rounded-md text-sm hover:from-red-600 hover:to-pink-600 transition"
                      onClick={() => enviarAposta("DOWN")}
                    >
                      Vender
                    </button>
                  </div>
                </div>
              </form>
              {/* Operações ativas (mobile) */}
              {activeBets.filter((b) => !b.closed && b.expiresAt > nowTs).length > 0 && (
                <div className="mt-2 bg-neutral-900 rounded-md p-2">
                  <div className="text-gray-300 text-xs mb-1">Operações ativas</div>
                  <div className="space-y-2">
                    {activeBets
                      .filter((b) => !b.closed && b.expiresAt > nowTs)
                      .sort((a, b) => a.expiresAt - b.expiresAt)
                      .map((b) => {
                        const remainingMs = Math.max(0, b.expiresAt - nowTs);
                        const remSec = Math.floor(remainingMs / 1000);
                        const mm = String(Math.floor(remSec / 60)).padStart(2, '0');
                        const ss = String(remSec % 60).padStart(2, '0');

                        const normalizedPair = normalizePair(b.pair || '');
                        const currentPrice = prices[normalizedPair];
                        const effectiveEntryPrice = b.entryPrice ?? currentPrice;
                        const PNL_DISPLAY_MULTIPLIER = 50;
                        let pnlPercent = 0;
                        let isWinning = false;

                        if (currentPrice && effectiveEntryPrice) {
                          if (b.arrow === 'UP') {
                            isWinning = currentPrice > effectiveEntryPrice;
                            pnlPercent = ((currentPrice - effectiveEntryPrice) / effectiveEntryPrice) * 100 * PNL_DISPLAY_MULTIPLIER;
                          } else {
                            isWinning = currentPrice < effectiveEntryPrice;
                            pnlPercent = ((effectiveEntryPrice - currentPrice) / effectiveEntryPrice) * 100 * PNL_DISPLAY_MULTIPLIER;
                          }
                        }

                        const cashoutAmount = isWinning
                          ? b.bet + b.bet * (pnlPercent / 100)
                          : Math.max(0, b.bet - b.bet * (pnlPercent / 100));

                        return (
                          <div key={b.id} className="flex flex-col gap-1 border-b border-neutral-800 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between text-gray-200 text-xs">
                              <div className="flex items-center gap-2">
                                <span className={b.arrow === 'UP' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                  {b.arrow === 'UP' ? '↑' : '↓'}
                                </span>
                                <span>{b.pair}</span>
                                <span className="text-gray-400">{formatCurrencyBRL(b.bet)}</span>
                              </div>
                              <span className="font-mono text-xs bg-neutral-800 px-1.5 py-0.5 rounded text-gray-400">{mm}:{ss}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-500">
                                Entrada: {effectiveEntryPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '--'}
                                {b.entryPrice && !b.serverId ? ' ~' : ''}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={isWinning ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                  {isWinning ? '+' : ''}{pnlPercent.toFixed(2)}%
                                </span>
                                <button
                                  onClick={() => cashout(b)}
                                  className={`px-1.5 py-0.5 rounded text-[9px] transition border font-semibold ${isWinning
                                      ? 'bg-green-900/40 hover:bg-green-800/60 text-green-300 border-green-700/50'
                                      : 'bg-red-900/40 hover:bg-red-800/60 text-red-300 border-red-700/50'
                                    }`}
                                >
                                  {cashoutAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
