"use client";

import { useState } from "react";
import classNames from "classnames";

export default function FluxoSaque() {
  const [step, setStep] = useState(1);
  const [cpf, setCpf] = useState("");
  const [valor, setValor] = useState("");

  const isCpfValid = (cpf: string) => /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/.test(cpf);
  const isValorValid = (v: string) => Number(v) >= 2;

  return (
    <div>
      {step === 1 && (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (isCpfValid(cpf)) setStep(2);
          }}
        >
          <div>
            <label className="block text-gray-300 mb-1 text-sm font-medium">
              Informe seu CPF (chave Pix)
            </label>
            <input
              type="text"
              maxLength={14}
              placeholder="Digite seu CPF"
              className="w-full bg-neutral-800 text-gray-200 rounded-lg px-3 py-2 outline-none border border-neutral-700 focus:border-red-500 transition"
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
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              className="flex-1 bg-neutral-700 text-gray-200 hover:bg-neutral-600 rounded-lg px-3 py-2 font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={classNames(
                "flex-1 bg-gradient-to-tr from-red-500 to-red-400 text-white font-semibold rounded-lg shadow-md transition px-3 py-2",
                isCpfValid(cpf)
                  ? "hover:from-red-600 hover:to-red-500"
                  : "opacity-60 cursor-not-allowed"
              )}
              disabled={!isCpfValid(cpf)}
            >
              Avançar
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (isValorValid(valor)) setStep(3);
          }}
        >
          <div>
            <label className="block text-gray-300 mb-1 text-sm font-medium">
              Valor do Saque <span className="text-xs text-gray-400">(mínimo R$ 2,00)</span>
            </label>
            <input
              type="number"
              min={2}
              step="0.01"
              placeholder="R$ 0,00"
              className="w-full bg-neutral-800 text-gray-200 rounded-lg px-3 py-2 outline-none border border-neutral-700 focus:border-red-500 transition text-lg font-semibold"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
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
                "flex-1 bg-gradient-to-tr from-red-500 to-red-400 text-white font-semibold rounded-lg shadow-md transition px-3 py-2",
                isValorValid(valor)
                  ? "hover:from-red-600 hover:to-red-500"
                  : "opacity-60 cursor-not-allowed"
              )}
              disabled={!isValorValid(valor)}
            >
              Confirmar
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="text-red-400 text-lg font-semibold">
            Saque solicitado com sucesso!
          </span>
          <p className="text-gray-400 text-sm">
            O valor de <span className="text-red-400 font-bold">R$ {valor}</span> será transferido
            para a chave Pix <span className="text-red-400 font-bold">{cpf}</span> em instantes.
          </p>
          <button
            type="button"
            className="bg-gradient-to-tr from-red-500 to-red-400 text-white font-semibold rounded-lg shadow-md transition px-4 py-2 hover:from-red-600 hover:to-red-500"
            onClick={() => setStep(1)}
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
