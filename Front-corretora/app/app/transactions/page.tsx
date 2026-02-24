"use client";

import { useState } from "react";
import Sidebar from "@/components/platform/sidebarapp";
import HeaderApp from "@/components/platform/headerapp";
// Remover a passagem de prop para FluxoDeposito, pois ela não aceita onPixCode diretamente
import FluxoDeposito from "@/components/transactions/FluxoDeposito";
import FluxoSaque from "@/components/transactions/FluxoSaque";
import { ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { QrCode } from "lucide-react";

// HOC para envolver FluxoDeposito e passar a prop onPixCode apenas se ela for aceita
function FluxoDepositoWrapper({ onPixCode }: { onPixCode: (code: string) => void }) {
  // Se FluxoDeposito não aceita props, apenas renderize sem passar nada
  // Se precisar passar, ajuste o componente FluxoDeposito para aceitar props corretamente
  // Aqui, vamos assumir que FluxoDeposito NÃO aceita props (conforme o erro do lint)
  // Então, não passamos nada
  // Se precisar de integração, mova o controle do PixCode para dentro do FluxoDeposito
  return <FluxoDeposito />;
}

function QrCodePix({ pixCode }: { pixCode: string }) {
  if (!pixCode) return null;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    pixCode
  )}&size=200x200`;
  return (
    <div className="flex flex-col items-center gap-2 my-4">
      <img
        src={qrUrl}
        alt="QR Code Pix"
        className="w-40 h-40 rounded-lg border border-neutral-800 bg-white"
      />
      <span className="text-xs text-gray-400">Escaneie o QR Code para pagar</span>
    </div>
  );
}

export default function TransacoesPage() {
  const [tab, setTab] = useState<"deposito" | "saque">("deposito");
  const [pixCode, setPixCode] = useState<string>("");

  // Se FluxoDeposito não aceita onPixCode, talvez o controle do PixCode deva ser feito dentro dele
  // Aqui, mantemos para uso futuro, mas não passamos para FluxoDeposito
  const handlePixCode = (code: string) => {
    setPixCode(code);
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      <HeaderApp />

      <div className="flex flex-1 min-h-0">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <main className="flex-1 flex flex-col items-center px-2 sm:px-6 py-8 overflow-y-auto w-full">
          <div className="w-full max-w-xl">
            <div className="flex flex-col items-center mb-10">
              <div className="flex items-center justify-center w-16 h-16 shadow">
                <ArrowDownToLine
                  className={`w-7 h-7 mr-1 ${
                    tab === "deposito" ? "text-green-400" : "text-gray-400"
                  }`}
                />
                <ArrowUpToLine
                  className={`w-7 h-7 ${
                    tab === "saque" ? "text-red-400" : "text-gray-400"
                  }`}
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-white mt-4">
                Transações Financeiras
              </h1>
              <p className="text-gray-400 text-base text-center max-w-md font-medium">
                Gerencie seus depósitos e saques com segurança e praticidade.
              </p>
            </div>

            <div className="flex gap-2 sm:gap-4 mb-8 justify-center">
              <button
                onClick={() => setTab("deposito")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition text-base border ${
                  tab === "deposito"
                    ? "bg-neutral-800 border-green-500 text-green-400 shadow"
                    : "bg-neutral-900 border-neutral-800 text-gray-300 hover:bg-neutral-800"
                }`}
                aria-current={tab === "deposito"}
              >
                <ArrowDownToLine className="w-5 h-5" />
                Depósito
              </button>
              <button
                onClick={() => setTab("saque")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition text-base border ${
                  tab === "saque"
                    ? "bg-neutral-800 border-red-500 text-red-400 shadow"
                    : "bg-neutral-900 border-neutral-800 text-gray-300 hover:bg-neutral-800"
                }`}
                aria-current={tab === "saque"}
              >
                <ArrowUpToLine className="w-5 h-5" />
                Saque
              </button>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg p-4 sm:p-8 w-full">
              {tab === "deposito" && (
                <>
                  {/* Removido onPixCode, pois FluxoDeposito não aceita props */}
                  <FluxoDeposito />
                  {/* Se precisar exibir o QR Code, você pode setar o pixCode manualmente para teste */}
                  {pixCode && (
                    <div className="flex flex-col items-center mt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-semibold text-base">
                          Pagamento via QR Code Pix
                        </span>
                      </div>
                      <QrCodePix pixCode={pixCode} />
                    </div>
                  )}
                </>
              )}
              {tab === "saque" && <FluxoSaque />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
