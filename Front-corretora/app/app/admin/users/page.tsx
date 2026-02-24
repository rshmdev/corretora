"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { Users, UserPlus, UserCheck, UserX, Edit, Trash2 } from "lucide-react";

// shadcn UI imports
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from 'react-toastify';

// Dialog imports (shadcn)
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Usuario = {
  id: number;
  accountId: string;
  nome: string;
  email: string;
  phone?: string;
  role?: string;
  // Wallet
  walletDemo?: number;
  walletDeposit?: number;
  walletBalance?: number;
  walletBonus?: number;
  // Personal
  cpf?: string;
  dateOfBirth?: string;
  gender?: string;
  // Affiliate
  affiliateCpa?: number;
  affiliateRevenueShare?: number;
  affiliatePercentPerDeposit?: number;
  dataCadastro: string;
  status: "ativo" | "inativo" | "pendente";
};

type AccountsApiResponse = {
  total: number;
  accounts: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    wallet?: Record<string, unknown>;
    firstLogin?: number;
    lastLogin?: number;
    personalInfo?: Record<string, unknown>;
    affiliate?: Record<string, unknown>;
  }>;
};

function resolveStatusFromLogins(firstLogin?: number, lastLogin?: number): Usuario["status"] {
  const last = Number(lastLogin || 0);
  if (!last || Number.isNaN(last)) return "pendente";
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - last > THIRTY_DAYS ? "inativo" : "ativo";
}

function StatCard({
  title,
  value,
  icon,
  color,
  description,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}) {
  return (
    <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow flex flex-col items-start w-full">
      <div className="flex items-center gap-3 mb-2">
        <span className={`p-2 rounded-lg bg-opacity-20 ${color}`}>{icon}</span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <span className="text-xs text-gray-400 mt-1">{description}</span>
    </div>
  );
}

function EditUsuarioDialog({
  usuario,
  onSave,
  saving,
  isOpen,
}: {
  usuario: Usuario;
  onSave: (body: FlatEditPayload) => void;
  saving?: boolean;
  isOpen?: boolean;
}) {
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [phone, setPhone] = useState(usuario.phone || "");
  const [role, setRole] = useState<string>(usuario.role || "USER");
  // Wallet
  const [walletDemo, setWalletDemo] = useState<string>(
    usuario.walletDemo != null ? String(usuario.walletDemo) : ""
  );
  const [walletDeposit, setWalletDeposit] = useState<string>(
    usuario.walletDeposit != null ? String(usuario.walletDeposit) : ""
  );
  const [walletBalance, setWalletBalance] = useState<string>(
    usuario.walletBalance != null ? String(usuario.walletBalance) : ""
  );
  const [walletBonus, setWalletBonus] = useState<string>(
    usuario.walletBonus != null ? String(usuario.walletBonus) : ""
  );
  // Personal
  const [cpf, setCpf] = useState(usuario.cpf || "");
  const [dateOfBirth, setDateOfBirth] = useState(usuario.dateOfBirth || "");
  const [gender, setGender] = useState(usuario.gender || "");
  // Affiliate
  const [affiliateCpa, setAffiliateCpa] = useState<string>(
    usuario.affiliateCpa != null ? String(usuario.affiliateCpa) : ""
  );
  const [affiliateRevenueShare, setAffiliateRevenueShare] = useState<string>(
    usuario.affiliateRevenueShare != null ? String(usuario.affiliateRevenueShare) : ""
  );
  const [affiliatePercentPerDeposit, setAffiliatePercentPerDeposit] = useState<string>(
    usuario.affiliatePercentPerDeposit != null ? String(usuario.affiliatePercentPerDeposit) : ""
  );

  // Resetar valores padrões ao abrir o modal ou quando trocar de usuário
  React.useEffect(() => {
    if (!isOpen) return;
    setNome(usuario.nome);
    setEmail(usuario.email);
    setPhone(usuario.phone || "");
    setRole(usuario.role || "USER");
    setWalletDemo(String(usuario.walletDemo ?? 0));
    setWalletDeposit(String(usuario.walletDeposit ?? 0));
    setWalletBalance(String(usuario.walletBalance ?? 0));
    setWalletBonus(String(usuario.walletBonus ?? 0));
    setCpf(usuario.cpf || "");
    setDateOfBirth(usuario.dateOfBirth || "");
    setGender(usuario.gender || "");
    setAffiliateCpa(String(usuario.affiliateCpa ?? 0));
    setAffiliateRevenueShare(String(usuario.affiliateRevenueShare ?? 0));
    setAffiliatePercentPerDeposit(String(usuario.affiliatePercentPerDeposit ?? 0));
  }, [isOpen, usuario]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogDescription>
          Altere as informações do usuário abaixo e clique em salvar.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col gap-1">
          <Label className="text-white">Nome</Label>
          <Input
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-white"
            disabled
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-white">E-mail</Label>
          <Input
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-white">Telefone</Label>
          <Input
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-white"
          />
        </div>
        <div>
          <Label className="text-white">Papel</Label>
          <Select value={role} onValueChange={v => setRole(v)}>
            <SelectTrigger className="bg-neutral-900 border border-neutral-800 text-white w-full mt-1">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border border-neutral-800 text-white">
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="AFFILIATE">AFFILIATE</SelectItem>
              <SelectItem value="USER">USER</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-white">Wallet Demo</Label>
            <Input
              type="number"
              placeholder="Demo"
              value={walletDemo}
              onChange={(e) => setWalletDemo(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-white">Wallet Depósito</Label>
            <Input
              type="number"
              placeholder="Depósito"
              value={walletDeposit}
              onChange={(e) => setWalletDeposit(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-white">Wallet Saldo</Label>
            <Input
              type="number"
              placeholder="Saldo"
              value={walletBalance}
              onChange={(e) => setWalletBalance(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-white">Wallet Bônus</Label>
            <Input
              type="number"
              placeholder="Bônus"
              value={walletBonus}
              onChange={(e) => setWalletBonus(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-white">CPF</Label>
            <Input
              placeholder="CPF"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-white">Nascimento</Label>
            <Input
              type="date"
              placeholder="YYYY-MM-DD"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white"
            />
          </div>
          <div>
            <Label className="text-white">Gênero</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="bg-neutral-900 border border-neutral-800 text-white w-full mt-1">
                <SelectValue placeholder="Gênero" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border border-neutral-800 text-white">
                <SelectItem value="MALE">Masculino</SelectItem>
                <SelectItem value="FEMALE">Feminino</SelectItem>
                <SelectItem value="OTHER">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-white">Affiliate CPA</Label>
            <Input
              type="number"
              placeholder="0"
              value={affiliateCpa}
              onChange={(e) => setAffiliateCpa(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-white">Affiliate RevShare (%)</Label>
            <Input
              type="number"
              placeholder="0"
              value={affiliateRevenueShare}
              onChange={(e) => setAffiliateRevenueShare(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-white">% por Depósito</Label>
            <Input
              type="number"
              placeholder="0"
              value={affiliatePercentPerDeposit}
              onChange={(e) => setAffiliatePercentPerDeposit(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white"
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button
            variant="outline"
            className="mr-2"
            type="button"
          >
            Cancelar
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button
            type="button"
            disabled={saving}
            onClick={() => onSave({
              phone,
              cpf: cpf || undefined,
              dateOfBirth: dateOfBirth || undefined,
              gender: gender || undefined,
              demo: walletDemo === "" ? 0 : Number(walletDemo),
              deposit: walletDeposit === "" ? 0 : Number(walletDeposit),
              balance: walletBalance === "" ? 0 : Number(walletBalance),
              bonus: walletBonus === "" ? 0 : Number(walletBonus),
              cpa: affiliateCpa === "" ? 0 : Number(affiliateCpa),
              revshare: affiliateRevenueShare === "" ? 0 : Number(affiliateRevenueShare),
              percentPerDeposit: affiliatePercentPerDeposit === "" ? 0 : Number(affiliatePercentPerDeposit),
              role,
            })}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

function DeleteUsuarioDialog({
  usuario,
  onDelete,
}: {
  usuario: Usuario;
  onDelete: (usuario: Usuario) => void;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Excluir Usuário</DialogTitle>
        <DialogDescription>
          Tem certeza que deseja excluir o usuário <b>{usuario.nome}</b>? Esta ação não poderá ser desfeita.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" className="mr-2" type="button">
            Cancelar
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button
            variant="destructive"
            type="button"
            onClick={() => onDelete(usuario)}
          >
            Excluir
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

type FlatEditPayload = {
  phone?: string;
  cpf?: string;
  dateOfBirth?: string;
  gender?: string;
  demo: number;
  deposit: number;
  balance: number;
  bonus: number;
  cpa: number;
  revshare: number;
  percentPerDeposit: number;
  role?: string;
};

function UsuariosTable({
  usuarios,
  onEdit,
  onDelete,
  savingId,
}: {
  usuarios: Usuario[];
  onEdit: (usuario: Usuario, body: FlatEditPayload) => void;
  onDelete: (usuario: Usuario) => void;
  savingId?: number | null;
}) {
  const [editDialogOpenId, setEditDialogOpenId] = useState<number | null>(null);
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<number | null>(null);

  return (
    <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow w-full overflow-x-auto">
      <h3 className="text-lg font-semibold text-white mb-4">Usuários</h3>
      <table className="min-w-full text-sm text-gray-300">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className="py-2 px-3 text-left">Nome</th>
            <th className="py-2 px-3 text-left">E-mail</th>
            <th className="py-2 px-3 text-left">Data de Cadastro</th>
            <th className="py-2 px-3 text-left">Status</th>
            <th className="py-2 px-3 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id} className="border-b border-neutral-800 last:border-b-0">
              <td className="py-2 px-3">{usuario.nome}</td>
              <td className="py-2 px-3">{usuario.email}</td>
              <td className="py-2 px-3">{usuario.dataCadastro}</td>
              <td className="py-2 px-3">
                {usuario.status === "ativo" && (
                  <span className="px-2 py-1 rounded bg-green-900 text-green-400 text-xs flex items-center gap-1">
                    <UserCheck className="w-4 h-4 inline" /> Ativo
                  </span>
                )}
                {usuario.status === "pendente" && (
                  <span className="px-2 py-1 rounded bg-yellow-900 text-yellow-400 text-xs flex items-center gap-1">
                    <UserPlus className="w-4 h-4 inline" /> Pendente
                  </span>
                )}
                {usuario.status === "inativo" && (
                  <span className="px-2 py-1 rounded bg-red-900 text-red-400 text-xs flex items-center gap-1">
                    <UserX className="w-4 h-4 inline" /> Inativo
                  </span>
                )}
              </td>
              <td className="py-2 px-3">
                <div className="flex gap-2">
                  <Dialog open={editDialogOpenId === usuario.id} onOpenChange={open => setEditDialogOpenId(open ? usuario.id : null)}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="text-blue-400 hover:bg-blue-900" title="Editar">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <EditUsuarioDialog
                      usuario={usuario}
                      saving={savingId === usuario.id}
                      isOpen={editDialogOpenId === usuario.id}
                      onSave={(body) => {
                        onEdit(usuario, body);
                        setEditDialogOpenId(null);
                      }}
                    />
                  </Dialog>
                  <Dialog open={deleteDialogOpenId === usuario.id} onOpenChange={open => setDeleteDialogOpenId(open ? usuario.id : null)}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="text-red-400 hover:bg-red-900" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DeleteUsuarioDialog
                      usuario={usuario}
                      onDelete={(u) => {
                        onDelete(u);
                        setDeleteDialogOpenId(null);
                      }}
                    />
                  </Dialog>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!token || !api) return;
    let aborted = false;
    (async () => {
      try {
        const resp = await fetch(`${api}/v1/admin/accounts`, { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) return;
        const json = await resp.json().catch(() => null);
        if (!json?.status) return;
        const data = (json.data as AccountsApiResponse) || { total: 0, accounts: [] };
        if (aborted) return;
        const mapped: Usuario[] = (data.accounts || []).map((acc, idx) => {
          const nome = `${String(acc.firstName || '').trim()} ${String(acc.lastName || '').trim()}`.trim() || acc.email || 'Usuário';
          const dataCadastro = acc.firstLogin ? new Date(Number(acc.firstLogin)).toLocaleString('pt-BR') : '--';
          const status = resolveStatusFromLogins(acc.firstLogin, acc.lastLogin);
          return {
            id: idx + 1,
            accountId: acc.id,
            nome,
            email: acc.email || '',
            phone: (acc as any)?.personalInfo?.phone || '',
            role: acc.role || 'USER',
            walletDemo: Number((acc as any)?.wallet?.demo ?? 0),
            walletDeposit: Number((acc as any)?.wallet?.deposit ?? 0),
            walletBalance: Number((acc as any)?.wallet?.balance ?? 0),
            walletBonus: Number((acc as any)?.wallet?.bonus ?? 0),
            cpf: (acc as any)?.personalInfo?.cpf || '',
            dateOfBirth: (acc as any)?.personalInfo?.dateOfBirth || '',
            gender: (acc as any)?.personalInfo?.gender || '',
            affiliateCpa: Number((acc as any)?.affiliate?.cpa ?? 0),
            affiliateRevenueShare: Number((acc as any)?.affiliate?.revenueShare ?? 0),
            affiliatePercentPerDeposit: Number((acc as any)?.affiliate?.percentPerDeposit ?? 0),
            dataCadastro,
            status,
          };
        });
        setUsuarios(mapped);
      } catch {
      }
    })();
    return () => { aborted = true; };
  }, []);

  const totalUsuarios = usuarios.length.toString();
  const usuariosAtivos = usuarios.filter(u => u.status === "ativo").length.toString();
  const usuariosPendentes = usuarios.filter(u => u.status === "pendente").length.toString();
  const usuariosInativos = usuarios.filter(u => u.status === "inativo").length.toString();

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [nomeFilter, setNomeFilter] = useState<string>("");

  // Filtragem dos usuários
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const statusOk =
        statusFilter === "todos" ? true : usuario.status === statusFilter;
      const nomeOk =
        nomeFilter.trim() === ""
          ? true
          : usuario.nome
            .toLowerCase()
            .includes(nomeFilter.trim().toLowerCase());
      return statusOk && nomeOk;
    });
  }, [statusFilter, nomeFilter, usuarios]);

  // Funções de editar e excluir
  async function updateAccountOnServer(user: Usuario, body: FlatEditPayload) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!token || !api) return false;
    const payload: any = {
      ...body,
      ...(body.phone ? { phone: String(body.phone).replace(/\D/g, '') } : {}),
    };
    try {
      setSavingId(user.id);
      const resp = await fetch(`${api}/v1/admin/accounts/edit/${user.accountId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await resp.json().catch(() => null);
      if (resp.ok) {
        try { toast.success(json?.message || 'Alterações salvas com sucesso'); } catch { }
        return true;
      }
      try { toast.error(json?.message || 'Falha ao salvar alterações'); } catch { }
      return false;
    } finally {
      setSavingId(null);
    }
  }

  async function handleEditUsuario(user: Usuario, body: FlatEditPayload) {
    const ok = await updateAccountOnServer(user, body);
    setUsuarios((prev) => prev.map((u) => {
      if (u.id !== user.id) return u;
      return {
        ...u,
        phone: body.phone ?? u.phone,
        role: body.role ?? u.role,
        walletDemo: body.demo ?? u.walletDemo,
        walletDeposit: body.deposit ?? u.walletDeposit,
        walletBalance: body.balance ?? u.walletBalance,
        walletBonus: body.bonus ?? u.walletBonus,
        cpf: body.cpf ?? u.cpf,
        dateOfBirth: body.dateOfBirth ?? u.dateOfBirth,
        gender: body.gender ?? u.gender,
        affiliateCpa: body.cpa ?? u.affiliateCpa,
        affiliateRevenueShare: body.revshare ?? u.affiliateRevenueShare,
        affiliatePercentPerDeposit: body.percentPerDeposit ?? u.affiliatePercentPerDeposit,
      };
    }));
  }

  async function handleDeleteUsuario(usuarioExcluido: Usuario) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!token || !api) return;
    try {
      const resp = await fetch(`${api}/v1/accounts/delete/${usuarioExcluido.accountId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await resp.json().catch(() => null);
      if (resp.ok) {
        try { toast.success(json?.message || 'Usuário removido com sucesso'); } catch {}
        setUsuarios((prev) => prev.filter((u) => u.id !== usuarioExcluido.id));
      } else {
        try { toast.error(json?.message || 'Falha ao remover usuário'); } catch {}
      }
    } catch {
      try { toast.error('Falha ao remover usuário'); } catch {}
    }
  }

  return (
    <div className="flex bg-neutral-950 pt-[64px]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-2 flex flex-col gap-10 md:gap-12 max-w-7xl mx-auto w-full">
          <section>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Usuários</h1>
            <p className="text-gray-300 max-w-2xl">
              Visualize, gerencie e acompanhe todos os usuários cadastrados na plataforma.
            </p>
          </section>
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard
                title="Total de Usuários"
                value={totalUsuarios}
                icon={<Users className="w-6 h-6 text-blue-400" />}
                color="text-blue-400 bg-blue-900"
                description="Usuários cadastrados"
              />
              <StatCard
                title="Ativos"
                value={usuariosAtivos}
                icon={<UserCheck className="w-6 h-6 text-green-400" />}
                color="text-green-400 bg-green-900"
                description="Usuários ativos"
              />
              <StatCard
                title="Pendentes"
                value={usuariosPendentes}
                icon={<UserPlus className="w-6 h-6 text-yellow-400" />}
                color="text-yellow-400 bg-yellow-900"
                description="Aguardando ativação"
              />
              <StatCard
                title="Inativos"
                value={usuariosInativos}
                icon={<UserX className="w-6 h-6 text-red-400" />}
                color="text-red-400 bg-red-900"
                description="Usuários inativos"
              />
            </div>
          </section>
          {/* Filtros */}
          <section className="mt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Filtrar por nome"
                  value={nomeFilter}
                  onChange={(e) => setNomeFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
              <div className="w-full md:w-60">
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="bg-neutral-900 border border-neutral-800 text-white w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border border-neutral-800 text-white">
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <UsuariosTable
              usuarios={usuariosFiltrados}
              onEdit={handleEditUsuario}
              onDelete={handleDeleteUsuario}
              savingId={savingId}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
