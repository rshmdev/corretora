"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export default function SettingsPage() {
  // Campos existentes segundo a API
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [favicon, setFavicon] = useState("");
  const [minDeposit, setMinDeposit] = useState<string>("");
  const [minWithdraw, setMinWithdraw] = useState<string>("");
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [gatewayApiToken, setGatewayApiToken] = useState("");
  const [gatewayClientId, setGatewayClientId] = useState("");
  const [gatewayClientSecret, setGatewayClientSecret] = useState("");
  const [winPercent, setWinPercent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!token || !api) return;
    let aborted = false;
    setLoading(true);
    (async () => {
      try {
        const resp = await fetch(`${api}/v1/admin/settings`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!resp.ok) throw new Error('Falha ao carregar configurações');
        const json = await resp.json().catch(() => null);
        if (!json?.status) throw new Error('Resposta inválida');
        const d = json.data || {};
        if (aborted) return;
        setName(String(d.name || ''));
        setDescription(String(d.description || ''));
        setLogo(String(d.logo || ''));
        setFavicon(String(d.favicon || ''));
        setMinDeposit(String(d.transaction?.minDeposit ?? ''));
        setMinWithdraw(String(d.transaction?.minWithdraw ?? ''));
        setGatewayUrl(String(d.gateway?.url || ''));
        setGatewayApiToken(String(d.gateway?.apiToken || ''));
        setGatewayClientId(String(d.gateway?.clientId || ''));
        setGatewayClientSecret(String(d.gateway?.clientSecret || ''));
        setWinPercent(String(d.winPercent ?? ''));
      } catch (e: any) {
        try { toast.error(e?.message || 'Erro ao buscar configurações'); } catch {}
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  async function handleSave() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!token || !api) return;
    // Montar body exatamente como o backend espera (conforme imagem)
    const payload: any = {
      name,
      description,
      logo,
      favicon,
      winPercent: winPercent === '' ? 0 : Number(winPercent),
      transaction: {
        minDeposit: minDeposit === '' ? 0 : Number(minDeposit),
        minWithdraw: minWithdraw === '' ? 0 : Number(minWithdraw),
      },
      gateway: {
        url: gatewayUrl,
        apitoken: gatewayApiToken,
        clientId: gatewayClientId,
        clientSecret: gatewayClientSecret,
      },
    };
    try {
      setSaving(true);
      const resp = await fetch(`${api}/v1/admin/settings/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await resp.json().catch(() => null);
      if (resp.ok && json?.status) {
        try { toast.success(json?.message || 'Configurações salvas com sucesso'); } catch {}
      } else {
        try { toast.error(json?.message || 'Falha ao salvar configurações'); } catch {}
      }
    } catch {
      try { toast.error('Falha ao salvar configurações'); } catch {}
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex bg-neutral-950 pt-[64px]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-2 flex flex-col gap-10 md:gap-12 max-w-3xl mx-auto w-full">
          <section>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Configurações da Plataforma</h1>
            <p className="text-gray-300 max-w-2xl">
              Visualização e edição dos parâmetros principais. Estes campos refletem a resposta de /v1/admin/settings.
            </p>
          </section>
          <section className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow flex flex-col gap-6">
            <div>
              <Label className="text-white mb-1 block">Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white"
                placeholder="Nome da plataforma"
              />
            </div>
            <div>
              <Label className="text-white mb-1 block">Descrição</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white"
                placeholder="Descrição"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-1 block">Logo (URL)</Label>
                <Input
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 text-white"
                  placeholder="https://.../logo.png"
                />
                {logo && (
                  <img src={logo} alt="Logo" className="mt-2 h-10 object-contain" />
                )}
              </div>
              <div>
                <Label className="text-white mb-1 block">Favicon (URL)</Label>
                <Input
                  value={favicon}
                  onChange={(e) => setFavicon(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 text-white"
                  placeholder="https://.../favicon.ico"
                />
                {favicon && (
                  <img src={favicon} alt="Favicon" className="mt-2 h-8 w-8" />
                )}
              </div>
            </div>
          </section>
          <section className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow flex flex-col gap-6">
            <h3 className="text-lg font-semibold text-white">Transações</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-1 block">Depósito Mínimo</Label>
                <Input
                  type="number"
                  value={minDeposit}
                  onChange={(e) => setMinDeposit(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="text-white mb-1 block">Saque Mínimo</Label>
                <Input
                  type="number"
                  value={minWithdraw}
                  onChange={(e) => setMinWithdraw(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>
          </section>
          <section className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow flex flex-col gap-6">
            <h3 className="text-lg font-semibold text-white">Gateway</h3>
            <div>
              <Label className="text-white mb-1 block">URL</Label>
              <Input
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white"
                placeholder="https://api..."
              />
            </div>
            <div>
              <Label className="text-white mb-1 block">API Token</Label>
              <Input
                type="text"
                value={gatewayApiToken}
                onChange={(e) => setGatewayApiToken(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white"
                placeholder="token"
              />
            </div>
            <div>
              <Label className="text-white mb-1 block">Client ID</Label>
              <Input
                type="text"
                value={gatewayClientId}
                onChange={(e) => setGatewayClientId(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white"
                placeholder="client_id"
              />
            </div>
            <div>
              <Label className="text-white mb-1 block">Client Secret</Label>
              <Input
                type="text"
                value={gatewayClientSecret}
                onChange={(e) => setGatewayClientSecret(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white"
                placeholder="client_secret"
              />
            </div>
          </section>
          <section className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow flex flex-col gap-6">
            <div>
              <Label className="text-white mb-1 block">Porcentagem de Win (%)</Label>
              <Input
                type="number"
                value={winPercent}
                onChange={(e) => setWinPercent(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white"
                placeholder="80"
              />
            </div>
          </section>
          <section className="flex justify-end">
            <Button
              type="button"
              className="bg-green-700 hover:bg-green-800 text-white"
              disabled={saving || loading}
              onClick={handleSave}
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </section>
        </main>
      </div>
    </div>
  );
}
