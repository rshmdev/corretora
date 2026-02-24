"use client";
import React from "react";
import HeaderApp from "@/components/platform/headerapp";
import SidebarApp from "@/components/platform/sidebarapp";
import { Trophy, TrendingUp, ArrowUpRight } from "lucide-react";

const traders = [
  {
    nome: "Lucas Almeida",
    avatar: "https://ui-avatars.com/api/?name=Lucas+Almeida",
    ganhos: 12500.75,
    trades: 320,
    winrate: 82,
    rank: 1,
  },
  {
    nome: "Mariana Souza",
    avatar: "https://ui-avatars.com/api/?name=Mariana+Souza",
    ganhos: 11200.5,
    trades: 295,
    winrate: 78,
    rank: 2,
  },
  {
    nome: "Carlos Silva",
    avatar: "https://ui-avatars.com/api/?name=Carlos+Silva",
    ganhos: 9800.2,
    trades: 270,
    winrate: 75,
    rank: 3,
  },
  {
    nome: "Ana Paula",
    avatar: "https://ui-avatars.com/api/?name=Ana+Paula",
    ganhos: 8700.0,
    trades: 250,
    winrate: 73,
    rank: 4,
  },
  {
    nome: "Rafael Costa",
    avatar: "https://ui-avatars.com/api/?name=Rafael+Costa",
    ganhos: 8200.4,
    trades: 230,
    winrate: 70,
    rank: 5,
  },
];

export default function BestTradersPage() {
  return (
    <>
      <HeaderApp />
      <div className="flex w-full bg-background">
        <SidebarApp />
        <main className="flex-1 flex flex-col items-center py-10 px-2">
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2 mb-6">
              <Trophy className="text-yellow-400" size={32} />
              Melhores Traders
            </h1>
            <p className="text-gray-400 mb-8">
              Veja o ranking dos traders com melhor desempenho na plataforma. Parabéns aos destaques!
            </p>
            <div className="flex flex-col gap-4">
              {traders.map((trader, idx) => (
                <div
                  key={trader.nome}
                  className={`flex items-center justify-between bg-neutral-900 rounded-xl p-5 shadow-md border border-neutral-800 ${
                    idx === 0
                      ? "border-gray-400"
                      : idx === 1
                      ? "border-gray-400"
                      : idx === 2
                      ? "border-amber-700"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={trader.avatar}
                        alt={trader.nome}
                        className="w-14 h-14 rounded-full border-4 border-green-500"
                      />
                      {trader.rank <= 3 && (
                        <span
                          className={`absolute -top-2 -right-2 rounded-full p-1 ${
                            trader.rank === 1
                              ? "bg-yellow-400"
                              : trader.rank === 2
                              ? "bg-gray-400"
                              : "bg-amber-700"
                          }`}
                          title={`#${trader.rank}`}
                        >
                          <Trophy
                            size={20}
                            className={
                              trader.rank === 1
                                ? "text-yellow-900"
                                : trader.rank === 2
                                ? "text-gray-900"
                                : "text-yellow-100"
                            }
                          />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-lg flex items-center gap-2">
                        {trader.nome}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {trader.trades} trades • Winrate:{" "}
                        <span className="text-green-400 font-semibold">
                          {trader.winrate}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-green-400 font-bold text-xl flex items-center gap-1">
                      <TrendingUp size={18} />
                      R$ {trader.ganhos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-gray-400">Ganhos totais</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col items-center">
              <span className="text-gray-400 text-sm">
                Continue operando para entrar no ranking dos melhores traders!
              </span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
