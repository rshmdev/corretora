"use client";

import { useEffect, useState } from "react";
import classNames from "classnames";
import { useAccount } from "@/context/account/AccountContext";
import { toast } from "react-toastify";

export default function FluxoDeposito() {
  const { account } = useAccount();
  const [step, setStep] = useState(1);
  const [cpf, setCpf] = useState("");
  const [valor, setValor] = useState("");
  const [loadingPix, setLoadingPix] = useState(false);
  const [pixCode, setPixCode] = useState("");
  const [transaction, setTransaction] = useState<any | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [cpfError, setCpfError] = useState("");
  const [cpfSubmitting, setCpfSubmitting] = useState(false);

  const valoresPreDefinidos = [10, 20, 50, 100, 200];

  const isCpfValid = (cpf: string) => /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/.test(cpf);
  const isValorValid = (v: string) => Number(v) >= 2;

  const hasCpf = Boolean((account as any)?.personalInfo?.cpf);

  useEffect(() => {
    if (hasCpf && step === 1) {
      setStep(2);
    }
  }, [hasCpf, step]);

  const onlyDigits = (value: string) => (value ?? "").replace(/\D/g, "");
  const formatCurrencyBRL = (value: number) =>
    (Number.isFinite(value) ? value : 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const resetFlow = () => {
    setStep(hasCpf ? 2 : 1);
    setValor("");
    setPixCode("");
    setTransaction(null);
    setStatus(null);
    setPolling(false);
  };

  async function submitCpf(): Promise<void> {
    try {
      setCpfError("");
      setCpfSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("Não autenticado");
      const api = process.env.NEXT_PUBLIC_API_URL as string;
      const response = await fetch(`${api}/v1/account/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cpf: onlyDigits(cpf) }),
      });
      let json: any = null;
      try { json = await response.json(); } catch { }
      if (!json || json.status === false) {
        const message = json?.message || "Falha ao validar CPF";
        throw new Error(message);
      }
      setStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao validar CPF";
      setCpfError(message);
      try { toast.error(message); } catch { }
    } finally {
      setCpfSubmitting(false);
    }
  }

  const gerarPix = async () => {
    try {
      setLoadingPix(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("Não autenticado");
      const api = process.env.NEXT_PUBLIC_API_URL as string;
      const amountNum = Number(valor);
      const response = await fetch(`${api}/v1/account/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amountNum }),
      });

      let json: any = null;
      try { json = await response.json(); } catch { }
      console.log(json)
      if (!json || json.status !== true) {
        const message = json?.message || "Falha ao gerar PIX";
        throw new Error(message);
      }
      const data = json.data || {};
      const code =
        data.qrcode ||
        data.pixCode ||
        data.code ||
        data.brCode ||
        data.copyPaste ||
        data.copyAndPaste ||
        data.copy_paste ||
        JSON.stringify(data);
      setPixCode(String(code));
      setTransaction(data);
      if (typeof data.status === "string") setStatus(data.status);
      setStep(3);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar PIX";
      try { const { toast } = await import("react-toastify"); toast.error(message); } catch { }
    } finally {
      setLoadingPix(false);
    }
  };

  useEffect(() => {
    if (step !== 3 || !transaction?.id || status === "APPROVED") return;
    let intervalId: any = null;
    setPolling(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const api = process.env.NEXT_PUBLIC_API_URL as string;
    intervalId = setInterval(async () => {
      try {
        if (!token) return;
        const resp = await fetch(`${api}/v1/account/deposit/${transaction.id}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        let json: any = null;
        try { json = await resp.json(); } catch { }
        const newStatus: string | undefined = json?.data?.status;
        if (newStatus) setStatus(newStatus);
        if (newStatus === "APPROVED") {
          setTransaction((prev: any) => ({ ...(prev || {}), ...(json?.data || {}) }));
          try { toast.success("Depósito aprovado!"); } catch { }
          if (intervalId) clearInterval(intervalId);
          setPolling(false);
        }
      } catch {
        // silencioso
      }
    }, 1000);
    return () => {
      if (intervalId) clearInterval(intervalId);
      setPolling(false);
    };
  }, [step, transaction?.id, status]);

  return (
    <div>
      {step === 1 && !hasCpf && (
        <form
          className="flex flex-col gap-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!isCpfValid(cpf) || cpfSubmitting) return;
            await submitCpf();
          }}
        >
          <div>
            <label className="block text-gray-300 mb-1 text-sm font-medium">
              Informe seu CPF
            </label>
            <input
              type="text"
              maxLength={14}
              placeholder="Digite seu CPF"
              className="w-full bg-neutral-800 text-gray-200 rounded-lg px-3 py-2 outline-none border border-neutral-700 focus:border-green-500 transition"
              value={cpf}
              onChange={(e) =>
                setCpf(
                  e.target.value
                    .replace(/\D/g, "")
                    .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                    .slice(0, 14)
                )
              }
              required
            />
            {cpfError && (
              <p className="text-red-400 text-xs mt-1">{cpfError}</p>
            )}
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              className="flex-1 bg-neutral-700 text-gray-200 hover:bg-neutral-600 rounded-lg px-3 py-2 font-medium transition"
              onClick={() => setStep(1)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={classNames(
                "flex-1 bg-gradient-to-tr from-green-500 to-green-400 text-white font-semibold rounded-lg shadow-md transition px-3 py-2",
                isCpfValid(cpf) && !cpfSubmitting
                  ? "hover:from-green-600 hover:to-green-500"
                  : "opacity-60 cursor-not-allowed"
              )}
              disabled={!isCpfValid(cpf) || cpfSubmitting}
            >
              {cpfSubmitting ? "Validando..." : "Avançar"}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form
          className="flex flex-col gap-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!isValorValid(valor)) return;
            await gerarPix();
          }}
        >
          <div>
            <label className="block text-gray-300 mb-1 text-sm font-medium">
              Valor do Depósito <span className="text-xs text-gray-400">(mínimo R$ 2,00)</span>
            </label>
            <input
              type="number"
              min={2}
              step="0.01"
              placeholder="R$ 0,00"
              className="w-full bg-neutral-800 text-gray-200 rounded-lg px-3 py-2 outline-none border border-neutral-700 focus:border-green-500 transition text-lg font-semibold"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {valoresPreDefinidos.map((v) => (
                <button
                  type="button"
                  key={v}
                  className={classNames(
                    "px-4 py-2 rounded-lg font-semibold text-sm transition border",
                    valor === v.toString()
                      ? "bg-gradient-to-tr from-green-500 to-green-400 text-white border-green-500 shadow"
                      : "bg-neutral-800 text-green-400 border-neutral-700 hover:bg-neutral-700"
                  )}
                  onClick={() => setValor(v.toString())}
                >
                  R$ {v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              className="flex-1 bg-neutral-700 text-gray-200 hover:bg-neutral-600 rounded-lg px-3 py-2 font-medium transition"
              onClick={() => setStep(1)}
            >
              Voltar
            </button>
            <button
              type="submit"
              className={classNames(
                "flex-1 bg-gradient-to-tr from-green-500 to-green-400 text-white font-semibold rounded-lg shadow-md transition px-3 py-2",
                isValorValid(valor)
                  ? "hover:from-green-600 hover:to-green-500"
                  : "opacity-60 cursor-not-allowed"
              )}
              disabled={!isValorValid(valor)}
            >
              Avançar
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-gray-300 mb-1 text-sm font-medium">
              Pagamento via Pix
            </label>
            {loadingPix ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-green-400 text-base font-semibold animate-pulse">
                  Gerando código Pix...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {pixCode && (
                  <div className="flex flex-col items-center gap-2 my-1">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pixCode)}&size=200x200`}
                      alt="QR Code Pix"
                      className="w-40 h-40 rounded-lg border border-neutral-800 bg-white"
                    />
                    <span className="text-xs text-gray-400">Escaneie o QR Code para pagar</span>
                  </div>
                )}
                <div className="bg-neutral-800 rounded-lg p-4 w-full text-center break-all text-green-400 text-xs select-all border border-green-700 shadow-inner">
                  {pixCode}
                </div>
                <span className="text-gray-400 text-xs">
                  Copie o código acima e pague no seu app bancário.
                </span>

                <div className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 mt-2">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Valor</span>
                    <span className="font-semibold text-green-400">
                      {formatCurrencyBRL(Number(transaction?.amount ?? valor))}
                    </span>
                  </div>
                  {transaction?.reference && (
                    <div className="mt-2 text-xs text-gray-400 break-all">
                      <span className="text-gray-300">Referência: </span>
                      <span className="font-mono">{transaction.reference}</span>
                    </div>
                  )}
                  <div className="mt-2 text-xs">
                    <span className="text-gray-300">Status: </span>
                    <span
                      className={classNames(
                        "font-semibold",
                        (status || transaction?.status) === "APPROVED" ? "text-green-400" : "text-yellow-400"
                      )}
                    >
                      {status || transaction?.status || "PENDING"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              className="flex-1 bg-neutral-700 text-gray-200 hover:bg-neutral-600 rounded-lg px-3 py-2 font-medium transition"
              onClick={() => setStep(2)}
              disabled={loadingPix}
            >
              Voltar
            </button>
            <button
              type="button"
              className={classNames(
                "flex-1 bg-gradient-to-tr from-green-500 to-green-400 text-white font-semibold rounded-lg shadow-md transition px-3 py-2",
                loadingPix
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:from-green-600 hover:to-green-500"
              )}
              disabled={loadingPix}
              onClick={resetFlow}
            >
              {(status || transaction?.status) === "APPROVED" ? "Concluir" : "Fechar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
