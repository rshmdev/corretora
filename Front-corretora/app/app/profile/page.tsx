"use client";
import React, { useEffect, useState } from "react";
import HeaderApp from "@/components/platform/headerapp";
import SidebarApp from "@/components/platform/sidebarapp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useAccount } from "@/context/account/AccountContext";
import { toast } from "react-toastify";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProfilePage() {
  
  const { account, refreshAccount } = useAccount();

  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    cpf: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    address: {
      country: "",
      state: "",
      city: "",
      street: "",
      zipCode: "",
    },
  });

  function onlyDigits(value: string): string {
    return (value ?? "").replace(/\D/g, "");
  }

  function formatCpf(value: string): string {
    const digits = onlyDigits(value).slice(0, 11);
    const len = digits.length;
    if (len <= 3) return digits;
    if (len <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (len <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function formatPhone(value: string): string {
    const digits = onlyDigits(value).slice(0, 11);
    const len = digits.length;
    if (len === 0) return "";
    const ddd = digits.slice(0, 2);
    if (len <= 2) return `(${ddd}`;
    if (len <= 6) return `(${ddd}) ${digits.slice(2)}`;
    if (len <= 10) return `(${ddd}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${ddd}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function formatCep(value: string): string {
    const digits = onlyDigits(value).slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  useEffect(() => {
    const a = account as any;
    setEditData({
      cpf: formatCpf(a?.personalInfo?.cpf ?? ""),
      dateOfBirth: a?.personalInfo?.dateOfBirth ?? "",
      gender: a?.personalInfo?.gender ?? "",
      phone: formatPhone(a?.personalInfo?.phone ?? a?.phone ?? ""),
      address: {
        country: a?.personalInfo?.address?.country ?? "",
        state: a?.personalInfo?.address?.state ?? "",
        city: a?.personalInfo?.address?.city ?? "",
        street: a?.personalInfo?.address?.street ?? "",
        zipCode: formatCep(a?.personalInfo?.address?.zipCode ?? ""),
      },
    });
  }, [account]);

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const key = name.split(".")[1] as keyof typeof editData.address;
      if (key === "zipCode") {
        setEditData((prev) => ({
          ...prev,
          address: { ...prev.address, zipCode: formatCep(value) },
        }));
        return;
      }
      setEditData((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
      return;
    }
    if (name === "cpf") {
      setEditData((prev) => ({ ...prev, cpf: formatCpf(value) }));
      return;
    }
    if (name === "phone") {
      setEditData((prev) => ({ ...prev, phone: formatPhone(value) }));
      return;
    }
    setEditData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Não autenticado");
      }
      const api = process.env.NEXT_PUBLIC_API_URL as string;
      const payload = {
        cpf: onlyDigits(editData.cpf),
        dateOfBirth: editData.dateOfBirth,
        gender: editData.gender || "NOT_SPECIFIED",
        phone: onlyDigits(editData.phone),
        address: {
          ...editData.address,
          country: editData.address.country || "BRAZIL",
          zipCode: onlyDigits(editData.address.zipCode),
        },
      };

      const response = await fetch(`${api}/v1/account/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar informações pessoais");
      }

      toast.success("Informações atualizadas com sucesso");
      await refreshAccount();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <HeaderApp />
      <div className="flex w-full bg-background">
        <SidebarApp />
        <main
          className="flex-1 flex justify-center items-center"
        >
          <div className="mt-5 shadow-2xl p-8 w-full max-w-6xl border flex flex-col items-center backdrop-blur-sm">
            {/* Avatar e nome */}
            <div className="flex flex-col items-center mb-6">
              <img
                src="/logo2.png"
                alt="Avatar"
                className="w-28 h-28 rounded-full border-4 border-green-500 shadow-lg mb-3"
              />
              <h2 className="text-xl font-bold text-white">
                {String((account as any)?.firstName ?? "")} {String((account as any)?.lastName ?? "")}
              </h2>
              <p className="text-gray-400 text-sm">{String((account as any)?.email ?? "")}</p>
            </div>

            {/* Infos do usuário */}
            <div className="w-full flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Nome" value={String((account as any)?.firstName ?? "")} />
                <InfoField label="Sobrenome" value={String((account as any)?.lastName ?? "")} />
              </div>
              <InfoField label="Email" value={String((account as any)?.email ?? "")} />
              <InfoField label="Telefone" value={String((account as any)?.personalInfo?.phone ?? (account as any)?.phone ?? "")} />
              <div className="grid grid-cols-2 gap-4">
                <InfoField
                  label="Saldo"
                  value={`R$ ${Number((account as any)?.wallet?.balance ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  highlight
                />
                <InfoField
                  label="Membro desde"
                  value={(() => {
                    const ts = (account as any)?.firstLogin;
                    const d = typeof ts === "number" ? new Date(ts) : ts ? new Date(String(ts)) : null;
                    return d ? d.toLocaleDateString("pt-BR") : "";
                  })()}
                />
              </div>
            </div>

            {/* Botão de edição na parte de baixo dos inputs ao lado direito */}
            <div className="w-full flex justify-end mt-8">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-tr from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white font-semibold px-4 py-2 rounded-xl shadow-md transition">
                    <Edit size={18} /> Editar Perfil
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-900 border-neutral-800 max-w-lg rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-white text-lg">
                      Editar Perfil
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    className="flex flex-col gap-4"
                    onSubmit={async (e) => {
                      await handleEditSubmit(e);
                      const closeBtn = document.querySelector("[data-dialog-close]");
                      if (closeBtn) (closeBtn as HTMLElement).click();
                    }}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex-1">
                        <label className="block text-gray-300 mb-1" htmlFor="edit-cpf">CPF</label>
                        <Input
                          id="edit-cpf"
                          name="cpf"
                          type="text"
                          className="bg-neutral-800 text-gray-200 rounded-lg"
                          value={editData.cpf}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-gray-300 mb-1" htmlFor="edit-phone">Telefone</label>
                        <Input
                          id="edit-phone"
                          name="phone"
                          type="text"
                          className="bg-neutral-800 text-gray-200 rounded-lg"
                          value={editData.phone}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex-1">
                        <label className="block text-gray-300 mb-1" htmlFor="edit-dob">Data de nascimento</label>
                        <Input
                          id="edit-dob"
                          name="dateOfBirth"
                          type="date"
                          className="bg-neutral-800 text-gray-200 rounded-lg"
                          value={editData.dateOfBirth}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-gray-300 mb-1">Gênero</label>
                        <Select
                          value={editData.gender || "NOT_SPECIFIED"}
                          onValueChange={(v) => setEditData((p) => ({ ...p, gender: v }))}
                        >
                          <SelectTrigger className="bg-neutral-800 text-gray-200 rounded-lg w-full">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Masculino</SelectItem>
                            <SelectItem value="FEMALE">Feminino</SelectItem>
                            <SelectItem value="NOT_SPECIFIED">Não-especificado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>  
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex-1">
                        <label className="block text-gray-300 mb-1" htmlFor="edit-country">País</label>
                        <Select
                          value={editData.address.country || "BRAZIL"}
                          onValueChange={(v) => setEditData((p) => ({ ...p, address: { ...p.address, country: v } }))}
                        >
                          <SelectTrigger className="bg-neutral-800 text-gray-200 rounded-lg w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BRAZIL">Brasil</SelectItem>
                            <SelectItem value="UNITED_STATES">Estados Unidos</SelectItem>
                            <SelectItem value="ENGLAND">Inglaterra</SelectItem>
                            <SelectItem value="CANADIAN">Canadá</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-gray-300 mb-1" htmlFor="edit-state">Estado</label>
                        <Input
                          id="edit-state"
                          name="address.state"
                          type="text"
                          className="bg-neutral-800 text-gray-200 rounded-lg"
                          value={editData.address.state}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex-1">
                        <label className="block text-gray-300 mb-1" htmlFor="edit-city">Cidade</label>
                        <Input
                          id="edit-city"
                          name="address.city"
                          type="text"
                          className="bg-neutral-800 text-gray-200 rounded-lg"
                          value={editData.address.city}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-gray-300 mb-1" htmlFor="edit-zip">CEP</label>
                        <Input
                          id="edit-zip"
                          name="address.zipCode"
                          type="text"
                          className="bg-neutral-800 text-gray-200 rounded-lg"
                          value={editData.address.zipCode}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-1" htmlFor="edit-street">Endereço</label>
                      <Input
                        id="edit-street"
                        name="address.street"
                        type="text"
                        className="bg-neutral-800 text-gray-200 rounded-lg"
                        value={editData.address.street}
                        onChange={handleEditChange}
                      />
                    </div>
                    <DialogFooter className="flex gap-3 mt-4">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          className="flex-1 bg-neutral-700 text-gray-200 hover:bg-neutral-600 rounded-lg"
                          data-dialog-close
                          disabled={saving}
                        >
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-gradient-to-tr from-green-500 to-green-400 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-green-500 transition"
                      >
                        {saving ? "Salvando..." : "Salvar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// Componente para reaproveitar os campos
function InfoField({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-400 text-sm">{label}</span>
      <span
        className={`mt-1 px-3 py-2 rounded-lg bg-neutral-900 ${
          highlight ? "text-green-400 font-semibold" : "text-gray-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
