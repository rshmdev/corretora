"use client"
import React, { useState, useEffect, useMemo, useRef } from "react";
import TradingChart, { ChartMarker, LiveCandle } from "@/components/traderoom/TradingChart";
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
  const PNL_DISPLAY_MULTIPLIER = 50;

  // Busca o objeto da moeda selecionada
  const moedaSelecionada = CRYPTOS.find((c) => c.value === moeda) || CRYPTOS[0];

  // liveCandle — alimentado pelo WebSocket de klines
  const [liveCandle, setLiveCandle] = useState<LiveCandle | null>(null);

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
  const { send, subscribe } = useWs();
  const { account, refreshAccount } = useAccount();
  const unsubscribeBetsRef = useRef<(() => void) | null>(null);

  const systemWinPercent = useMemo(() => {
    const fromAccount = (account as any)?.systemWinPercent;
    const parsed = Number(fromAccount);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return 80;
  }, [account]);

  const retornoPercentual = systemWinPercent / 100;

  const possivelRetorno =
    investimento && !isNaN(Number(investimento))
      ? Number(investimento) + Number(investimento) * retornoPercentual
      : 0;

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
    entryPrice?: number;
    lineId?: string;
    closedAt?: number; // Timestamp de quando a aposta foi fechada no servidor
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

  // Subscreve ao preço do par atualmente selecionado — também alimenta o liveCandle do chart
  useEffect(() => {
    if (!moeda) return;
    const pair = normalizePair(moeda);
    const destination = `/topic/klines/${pair}/1m`;
    const un = subscribe(destination, (msg) => {
      try {
        const payload = JSON.parse(msg.body);
        if (payload && payload.close) {
          setPrices(prev => ({ ...prev, [pair]: payload.close }));
          // Alimenta o gráfico lightweight com a vela ao vivo
          if (payload.open && payload.high && payload.low && payload.close && payload.openTime) {
            setLiveCandle({
              time: Number(payload.openTime),
              open: Number(payload.open),
              high: Number(payload.high),
              low: Number(payload.low),
              close: Number(payload.close),
            });
          }
        }
      } catch (e) { }
    });
    // Reseta o liveCandle ao trocar de moeda
    setLiveCandle(null);
    return () => un?.();
  }, [moeda, subscribe]);

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

  // Listener para resultados de apostas vindos do servidor
  useEffect(() => {
    if (!accountId) return;

    const destination = `/topic/bets/${accountId}`;
    const un = subscribe(destination, (msg) => {
      try {
        const payload = JSON.parse(msg.body);
        console.log('📬 Mensagem de bet recebida:', payload);

        // Se for um objeto de aposta finalizada
        if (payload.id && (payload.status === 'WIN' || payload.status === 'LOSE' || payload.finished)) {
          const betId = payload.id;

          setActiveBets(prev => prev.map(b => {
            if (b.id === betId || b.serverId === betId) {
              return { ...b, closed: true, serverId: betId, closedAt: Date.now() };
            }
            return b;
          }));
        }

        // Se for uma confirmação de criação de aposta (apenas para vincular o serverId)
        if (payload.id && !payload.finished && !payload.status) {
          setActiveBets(prev => {
            const index = prev.findIndex(b => b.id.startsWith('client-') && !b.serverId);
            if (index !== -1) {
              const newBets = [...prev];
              newBets[index] = { ...newBets[index], serverId: payload.id };
              return newBets;
            }
            return prev;
          });
        }
      } catch (e) {
        console.error('Erro ao processar mensagem de bet:', e);
      }
    });

    return () => un?.();
  }, [accountId, subscribe, refreshAccount]);

  // Cleanup effect: remove closed bets after 4 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      setActiveBets(prev => {
        const now = Date.now();
        const toRemove = prev.filter(b => b.closed && b.closedAt && now - b.closedAt > 4000);
        if (toRemove.length === 0) return prev;
        return prev.filter(b => !toRemove.includes(b));
      });
    }, 2000);
    return () => clearInterval(iv);
  }, []);

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
    // Priorizamos o campo 'profit' que agora o backend envia explicitamente
    const profitKeys = ['profit', 'pnl', 'pnlValue', 'net', 'netProfit'];
    for (const k of profitKeys) {
      const v = parseNumber(payload?.[k]);
      if (v !== null) return v;
    }

    // Se não houver 'profit', tentamos calcular a partir do payout (result) e do stake (bet)
    const betAmount = parseNumber(payload?.bet ?? payload?.amount ?? payload?.stake);
    const payout = parseNumber(payload?.result ?? payload?.payout ?? payload?.return ?? payload?.gross);

    if (betAmount !== null && payout !== null) {
      return payout - betAmount;
    }

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

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function computeDisplayPnlPercent(entryPrice: number, currentPrice: number): number {
    if (!entryPrice || !currentPrice) return 0;
    const realPnlPercent = Math.abs((currentPrice - entryPrice) / entryPrice) * 100;
    return realPnlPercent * PNL_DISPLAY_MULTIPLIER;
  }

  function computeCashoutAmount(
    bet: ActiveBet,
    currentPrice: number | undefined,
    winPercent: number,
    nowMs: number
  ): number | null {
    if (!currentPrice || !bet.entryPrice) return null;
    const displayPnlPercent = computeDisplayPnlPercent(bet.entryPrice, currentPrice);
    const totalTime = bet.expiresAt - bet.createdAt;
    const remainingTime = bet.expiresAt - nowMs;
    const timeProgress = totalTime > 0 ? clamp(1 - remainingTime / totalTime, 0, 1) : 1;
    const cappedWinPercent = Math.max(0, winPercent);

    const isWinning =
      (bet.arrow === 'UP' && currentPrice > bet.entryPrice) ||
      (bet.arrow === 'DOWN' && currentPrice < bet.entryPrice);

    if (isWinning) {
      const cappedDisplay = Math.min(displayPnlPercent, cappedWinPercent);
      const movePayout = bet.bet + bet.bet * (cappedDisplay / 100);
      const fullPayout = bet.bet + bet.bet * (cappedWinPercent / 100);
      const payout = movePayout + (fullPayout - movePayout) * timeProgress;
      return Math.max(0, payout);
    }

    let payout = Math.max(0, bet.bet - bet.bet * (displayPnlPercent / 100));
    const timeFactor = totalTime > 0 ? clamp(remainingTime / totalTime, 0, 1) : 0;
    payout = payout * Math.max(0.01, timeFactor);
    return Math.max(0, payout);
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
              try { refreshAccount(); } catch { }
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
                    };
                  }
                  return b;
                });

                if (updated) return next;

                // Nova aposta do servidor
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
  }, [accountId, subscribe, refreshAccount]);

  // Monta os marcadores para o TradingChart a partir das apostas ativas com entryPrice conhecido
  const chartMarkers: ChartMarker[] = useMemo(() =>
    activeBets
      .filter(b => !b.closed && b.expiresAt > nowTs && b.entryPrice != null)
      .map(b => {
        const normalizedPair = normalizePair(b.pair || '');
        const currentPrice = prices[normalizedPair];
        const effectiveEntryPrice = b.entryPrice!;
        const cashoutAmount = computeCashoutAmount(b, currentPrice, systemWinPercent, nowTs);

        return {
          id: b.id,
          time: Math.floor(b.createdAt / 1000) as import('lightweight-charts').UTCTimestamp,
          arrow: b.arrow,
          price: b.entryPrice!,
          betAmount: b.bet,
          cashoutAmount: currentPrice ? cashoutAmount ?? undefined : undefined,
        };
      }),
    [activeBets, nowTs, prices, systemWinPercent]);

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
            {/* Gráfico lightweight-charts com marcadores de operações */}
            <div className="flex-1 bg-neutral-950" style={{ minHeight: 480 }}>
              <TradingChart
                symbol={moedaSelecionada.value.replace("/", "")}
                liveCandle={liveCandle}
                markers={chartMarkers}
              />
            </div>

            <div className="hidden md:flex w-[340px] min-w-[300px] max-w-[400px] bg-background border-l border-neutral-800 flex-col p-6 overflow-y-auto">
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
                {/* Operações ativas (desktop) — logo abaixo do select */}
                {activeBets.filter((b) => !b.closed && b.expiresAt > nowTs).length > 0 && (
                  <div className="mt-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Operações ativas</span>
                      <span className="text-xs text-gray-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                        {activeBets.filter((b) => !b.closed && b.expiresAt > nowTs).length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
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
                          let pnlPercent = 0;
                          let isWinning = false;
                          if (currentPrice && effectiveEntryPrice) {
                            isWinning = b.arrow === 'UP' ? currentPrice > effectiveEntryPrice : currentPrice < effectiveEntryPrice;
                            pnlPercent = computeDisplayPnlPercent(effectiveEntryPrice, currentPrice);
                          }
                          const cashoutAmount = computeCashoutAmount(b, currentPrice, systemWinPercent, nowTs) ?? b.bet;

                          return (
                            <div
                              key={b.id}
                              className={`rounded-xl border p-3 flex flex-col gap-2 ${isWinning
                                ? 'bg-green-950/30 border-green-700/40'
                                : 'bg-red-950/30 border-red-700/40'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`text-lg font-bold leading-none ${b.arrow === 'UP' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {b.arrow === 'UP' ? '▲' : '▼'}
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="text-white font-semibold text-sm leading-tight">{b.pair}</span>
                                    <span className="text-gray-400 text-xs">{b.arrow === 'UP' ? 'Compra' : 'Venda'}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className={`font-mono text-sm font-bold tabular-nums ${remSec < 30 ? 'text-yellow-400 animate-pulse' : 'text-gray-300'
                                    }`}>{mm}:{ss}</span>
                                  <span className="text-gray-500 text-[10px]">restante</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between bg-neutral-900/60 rounded-lg px-3 py-2">
                                <div className="flex flex-col">
                                  <span className="text-gray-500 text-[10px] uppercase tracking-wide">Entrada</span>
                                  <span className="text-white text-sm font-mono font-semibold">
                                    {effectiveEntryPrice
                                      ? effectiveEntryPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                      : '--'}
                                    {b.entryPrice && !b.serverId ? <span className="text-yellow-500 ml-1 text-[9px]">~</span> : null}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-gray-500 text-[10px] uppercase tracking-wide">P&L</span>
                                  <span className={`text-sm font-bold ${isWinning ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {isWinning ? '+' : ''}{pnlPercent.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-gray-500 text-[10px] uppercase tracking-wide">Apostado</span>
                                  <span className="text-white text-sm font-semibold">{formatCurrencyBRL(b.bet)}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => cashout(b)}
                                className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 shadow-lg ${isWinning
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-green-900/40'
                                  : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white shadow-red-900/40'
                                  }`}
                              >
                                💰 Cashout — {cashoutAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                {/* Moeda selecionada */}
                <div className="mb-4 flex items-center">
                  <span className="text-gray-400 text-sm">Moeda selecionada:</span>
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
                      Retorno estimado de {systemWinPercent}%
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
              {
                activeBets.filter((b) => !b.closed && b.expiresAt > nowTs).length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">Operações ativas</span>
                      <span className="text-[10px] text-gray-500 bg-neutral-800 px-1.5 py-0.5 rounded-full">
                        {activeBets.filter((b) => !b.closed && b.expiresAt > nowTs).length}
                      </span>
                    </div>
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
                        let pnlPercent = 0;
                        let isWinning = false;
                        if (currentPrice && effectiveEntryPrice) {
                          isWinning = b.arrow === 'UP' ? currentPrice > effectiveEntryPrice : currentPrice < effectiveEntryPrice;
                          pnlPercent = computeDisplayPnlPercent(effectiveEntryPrice, currentPrice);
                        }
                        const cashoutAmount = computeCashoutAmount(b, currentPrice, systemWinPercent, nowTs) ?? b.bet;

                        return (
                          <div
                            key={b.id}
                            className={`rounded-xl border p-2.5 flex flex-col gap-2 ${isWinning
                              ? 'bg-green-950/30 border-green-700/40'
                              : 'bg-red-950/30 border-red-700/40'
                              }`}
                          >
                            {/* Topo — par + direção + timer */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold text-base leading-none ${b.arrow === 'UP' ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                  {b.arrow === 'UP' ? '▲' : '▼'}
                                </span>
                                <div>
                                  <span className="text-white font-semibold text-xs">{b.pair}</span>
                                  <span className={`ml-1.5 text-[10px] font-medium ${b.arrow === 'UP' ? 'text-green-400' : 'text-red-400'
                                    }`}>{b.arrow === 'UP' ? 'Compra' : 'Venda'}</span>
                                </div>
                              </div>
                              <span className={`font-mono text-sm font-bold tabular-nums ${remSec < 30 ? 'text-yellow-400 animate-pulse' : 'text-gray-300'
                                }`}>{mm}:{ss}</span>
                            </div>

                            {/* Info — entrada + P/L + aposta */}
                            <div className="flex items-center justify-between text-[10px] gap-1">
                              <div className="flex flex-col">
                                <span className="text-gray-500 uppercase tracking-wide" style={{ fontSize: '8px' }}>Entrada</span>
                                <span className="text-white font-mono font-semibold text-xs">
                                  {effectiveEntryPrice
                                    ? effectiveEntryPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : '--'}
                                </span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-gray-500 uppercase tracking-wide" style={{ fontSize: '8px' }}>P&L</span>
                                <span className={`text-xs font-bold ${isWinning ? 'text-green-400' : 'text-red-400'
                                  }`}>{isWinning ? '+' : ''}{pnlPercent.toFixed(2)}%</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-gray-500 uppercase tracking-wide" style={{ fontSize: '8px' }}>Aposta</span>
                                <span className="text-white font-semibold text-xs">{formatCurrencyBRL(b.bet)}</span>
                              </div>
                            </div>

                            {/* Botão Cashout */}
                            <button
                              onClick={() => cashout(b)}
                              className={`w-full py-2 rounded-lg font-bold text-xs transition-all active:scale-95 ${isWinning
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white'
                                : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white'
                                }`}
                            >
                              💰 Cashout — {cashoutAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )
              }
            </div >
          </div >
        </main >
      </div >
    </>
  );
}
