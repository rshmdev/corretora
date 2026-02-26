"use client";

import React, { useEffect, useRef } from "react";
import {
    createChart,
    IChartApi,
    ISeriesApi,
    CandlestickData,
    UTCTimestamp,
    LineStyle,
    IPriceLine,
    CandlestickSeries,
    createSeriesMarkers,
    ISeriesMarkersPluginApi,
    Time,
} from "lightweight-charts";

export type ChartMarker = {
    id: string;
    time: UTCTimestamp;
    arrow: "UP" | "DOWN";
    price: number;
    betAmount: number;
    cashoutAmount?: number;
};

export type LiveCandle = {
    time: number; // epoch ms
    open: number;
    high: number;
    low: number;
    close: number;
};

interface TradingChartProps {
    symbol: string;     // ex: "BTCUSDT"
    liveCandle?: LiveCandle | null;
    markers: ChartMarker[];
}

async function fetchBinanceKlines(symbol: string, limit = 200): Promise<CandlestickData[]> {
    try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw: any[][] = await res.json();
        return raw.map((k) => ({
            time: Math.floor(Number(k[0]) / 1000) as UTCTimestamp,
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
        }));
    } catch (e) {
        console.error("[TradingChart] Erro ao buscar klines:", e);
        return [];
    }
}

export default function TradingChart({ symbol, liveCandle, markers }: TradingChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
    const priceLineMapRef = useRef<Map<string, IPriceLine>>(new Map());

    // Inicializa o chart e carrega candles históricos
    useEffect(() => {
        if (!containerRef.current) return;

        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
            seriesRef.current = null;
            markersPluginRef.current = null;
        }

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight || 480,
            layout: {
                background: { color: "#0b0e11" },
                textColor: "#9aa4b0",
                fontSize: 12,
            },
            grid: {
                vertLines: { color: "#131722" },
                horzLines: { color: "#131722" },
            },
            crosshair: {
                vertLine: { color: "#444", width: 1, style: LineStyle.Solid },
                horzLine: { color: "#444", width: 1, style: LineStyle.Solid },
            },
            rightPriceScale: {
                borderColor: "#2a2e39",
                textColor: "#9aa4b0",
            },
            timeScale: {
                borderColor: "#2a2e39",
                timeVisible: true,
                secondsVisible: false,
            },
            handleScroll: true,
            handleScale: true,
        });

        const series = chart.addSeries(CandlestickSeries, {
            upColor: "#22ab94",
            downColor: "#f44336",
            borderUpColor: "#22ab94",
            borderDownColor: "#f44336",
            wickUpColor: "#22ab94",
            wickDownColor: "#f44336",
        });

        chartRef.current = chart;
        seriesRef.current = series;
        markersPluginRef.current = createSeriesMarkers(series, []);

        fetchBinanceKlines(symbol).then((candles) => {
            if (candles.length > 0 && seriesRef.current) {
                seriesRef.current.setData(candles);
                chartRef.current?.timeScale().fitContent();
            }
        });

        const ro = new ResizeObserver(() => {
            if (containerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight || 480,
                });
            }
        });
        ro.observe(containerRef.current);

        return () => {
            ro.disconnect();
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
            markersPluginRef.current = null;
            priceLineMapRef.current.clear();
        };
    }, [symbol]);

    // Vela ao vivo
    useEffect(() => {
        if (!liveCandle || !seriesRef.current) return;
        try {
            seriesRef.current.update({
                time: Math.floor(liveCandle.time / 1000) as UTCTimestamp,
                open: liveCandle.open,
                high: liveCandle.high,
                low: liveCandle.low,
                close: liveCandle.close,
            });
        } catch { }
    }, [liveCandle]);

    // Sincroniza marcadores e price lines com activeBets
    useEffect(() => {
        if (!seriesRef.current || !markersPluginRef.current) return;

        // Marcadores de seta (v5 via plugin)
        markersPluginRef.current.setMarkers(
            markers.map((m) => ({
                time: m.time,
                position: m.arrow === "UP" ? "belowBar" : "aboveBar",
                color: m.arrow === "UP" ? "#22c55e" : "#ef4444",
                shape: m.arrow === "UP" ? "arrowUp" : "arrowDown",
                text: `${m.arrow === "UP" ? "▲ Compra" : "▼ Venda"} ${m.cashoutAmount ? `| R$ ${m.cashoutAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : `R$ ${m.betAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}`,
                size: 2,
            } as any))
        );

        // Price lines horizontais
        const currentIds = new Set(markers.map((m) => m.id));
        priceLineMapRef.current.forEach((line, id) => {
            if (!currentIds.has(id)) {
                try { seriesRef.current?.removePriceLine(line); } catch { }
                priceLineMapRef.current.delete(id);
            }
        });

        markers.forEach((m) => {
            if (!priceLineMapRef.current.has(m.id) && seriesRef.current) {
                try {
                    const line = seriesRef.current.createPriceLine({
                        price: m.price,
                        color: m.arrow === "UP" ? "#22c55e88" : "#ef444488",
                        lineWidth: 1,
                        lineStyle: LineStyle.Dashed,
                        axisLabelVisible: true,
                        title: `${m.arrow === "UP" ? "▲" : "▼"} Entrada`,
                    });
                    priceLineMapRef.current.set(m.id, line);
                } catch { }
            }
        });
    }, [markers]);

    return (
        <div
            ref={containerRef}
            style={{ width: "100%", height: "100%", minHeight: 480, background: "#0b0e11" }}
        />
    );
}
