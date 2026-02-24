import React, { useState, useRef, useEffect } from "react";
import { Landmark } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useAccount } from "@/context/account/AccountContext";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}


type CryptoOption = {
  label: string;
  value: string;
  icon?: string;
  tradingViewSymbol?: string;
};

type HeaderAppProps = {
  cryptoOptions?: CryptoOption[];
  selectedCryptoValue?: string;
  onChangeCrypto?: (value: string) => void;
};

export default function HeaderApp({ cryptoOptions, selectedCryptoValue, onChangeCrypto }: HeaderAppProps) {
  const { account } = useAccount();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  // Toggle Demo/Real persistido em localStorage
  const [isDemo, setIsDemo] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("trade:demo");
      setIsDemo(raw === "1" || raw === "true");
    } catch { }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("trade:demo", isDemo ? "1" : "0");
      // Notificar interessados da mudança de modo (opcional)
      const ev = new CustomEvent("app:trade-mode", { detail: { demo: isDemo } });
      window.dispatchEvent(ev);
    } catch { }
  }, [isDemo]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  async function handleLogout() { setDropdownOpen(false); await logout(); }

  return (
    <header className="w-full bg-neutral-950 border-b flex-wrap border-neutral-800 px-4 py-2 flex items-center justify-between z-50 relative">
      <div className="flex items-center gap-2">

        <span className="flex items-center gap-2">
          <Landmark className="h-8 w-8 text-green-500" />
          <span className="text-white font-bold text-xl tracking-tight uppercase">blackpearlbroker</span>
        </span>
      </div>


      <div className="flex items-center gap-6">
        {cryptoOptions && cryptoOptions.length > 0 && (
          <div className="hidden md:flex items-center gap-2">
            <Select value={selectedCryptoValue} onValueChange={(v) => onChangeCrypto && onChangeCrypto(v)}>
              <SelectTrigger className="w-56 rounded-md bg-neutral-900 text-gray-200 px-3 py-2 focus:outline-none border border-neutral-800">
                <SelectValue placeholder="Selecione a cripto" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Criptomoedas</SelectLabel>
                  {cryptoOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center">
                        {c.icon && <img src={c.icon} alt={c.label} className="w-5 h-5 mr-2" style={{ background: "#fff", borderRadius: "50%" }} />}
                        {c.value}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
        {/* Toggle Demo/Real */}
        <div className="hidden sm:flex items-center gap-2 bg-neutral-900 rounded px-2 py-1 border border-neutral-800">
          <span className="text-gray-400 text-[10px] sm:text-xs">Modo</span>
          <span className={classNames("font-semibold text-[10px] sm:text-xs", isDemo ? "text-yellow-300" : "text-green-300")}>{isDemo ? "Demo" : "Real"}</span>
          <Switch checked={isDemo} onCheckedChange={(v) => setIsDemo(Boolean(v))} aria-label="Alternar conta Demo/Real" />
        </div>

        <div className="flex items-center gap-1 bg-neutral-900 rounded px-2 py-1 sm:gap-3 sm:px-4 sm:py-2">
          <span className="text-gray-400 text-[10px] sm:text-sm">Saldo:</span>
          <span className="text-white font-semibold text-xs sm:text-base">
            {(() => {
              const wallet = (account as any)?.wallet ?? {};
              const demo = Number((wallet as any)?.demo ?? 0);
              const deposit = Number((wallet as any)?.deposit ?? 0);
              const bonus = Number((wallet as any)?.bonus ?? 0);
              const balance = Number((wallet as any)?.balance ?? 0);
              const value = isDemo ? demo : (deposit + bonus + balance);
              return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            })()}
          </span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 focus:outline-none"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <img
              src={"https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt={account?.firstName + " " + account?.lastName}
              className="h-9 w-9 rounded-full border-2 border-green-400"
            />
            <svg
              className={classNames(
                "w-4 h-4 text-gray-400 transition-transform",
                dropdownOpen ? "rotate-180" : ""
              )}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-lg shadow-lg z-50 py-2 animate-fade-in">

              <div className="block sm:hidden">
                {/* <a
                  href="/app/open-trading"
                  className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
                >
                  Operações Abertas
                </a> */}
                <a
                  href="/app/trading-history"
                  className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
                >
                  Histórico de Trading
                </a>
                <a
                  href="/app/best-traders"
                  className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
                >
                  Melhores Traders
                </a>
                {/* <a
                  href="/app/copy-trader"
                  className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
                >
                  Copy Trader
                </a> */}
                {/* <a
                  href="/app/support"
                  className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
                >
                  Suporte
                </a> */}
                <div className="border-t border-neutral-800 my-2" />
              </div>

              <a
                href="/app/traderoom"
                className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
              >
                Negociação
              </a>
              <a
                href="/app/profile"
                className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
              >
                Meu Perfil
              </a>
              {account?.role === "AFFILIATE" && (
                <a
                  href="/app/aff"
                  className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
                >
                  Portal de Afiliado
                </a>
              )}
              <a
                href="/app/transactions"
                className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
              >
                Depósito
              </a>
              <a
                href="/app/transactions"
                className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
              >
                Saque
              </a>
              <div className="border-t border-neutral-800 my-2" />
              <button
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-neutral-800 transition"
                onClick={handleLogout}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}
