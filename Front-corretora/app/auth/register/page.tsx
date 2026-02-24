
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth';
import { toast } from 'react-toastify';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  Phone as PhoneIcon,
} from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhoneBR = (v: string) => {
    const digits = (v ?? '').replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isStrongPassword = (value: string) => value.trim().length >= 6;
  const normalizePhone = (v: string) => (v ?? '').replace(/\D/g, '');
  const isValidPhone = (v: string) => normalizePhone(v).length === 11;
  const isFormValid =
    nome.trim().length > 0 &&
    sobrenome.trim().length > 0 &&
    isValidEmail(email) &&
    isStrongPassword(password) &&
    password === confirmPassword &&
    isValidPhone(telefone) &&
    acceptedTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isFormValid) {
      const msg = 'Preencha todos os campos corretamente.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!acceptedTerms) {
      const msg = 'Você deve aceitar os Termos de Uso e Política de Privacidade.';
      setError(msg);
      toast.error(msg);
      return;
    }
    setLoading(true);
    try {
      await register(nome, sobrenome, email, password, normalizePhone(telefone));
    } catch (err) {
      const msg = 'Falha no registro. Tente novamente.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-2 sm:p-4 bg-[#101014]">
      <style jsx>{`
        .login-btn {
          background: linear-gradient(135deg, #222 0%, #111 100%);
          position: relative;
          overflow: hidden;
        }
        .login-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.08),
            transparent
          );
          transition: left 0.5s;
        }
        .login-btn:hover::before {
          left: 100%;
        }
      `}</style>
      <div className="z-10 w-full max-w-6xl">
        <div className="bg-[#18181b] overflow-hidden rounded-2xl sm:rounded-[40px] shadow-2xl border border-[#23232b]">
          <div className="flex flex-col lg:grid lg:min-h-[700px] lg:grid-cols-2">
            {/* Lado Esquerdo - escondido no mobile, visível apenas em telas lg+ */}
            <div className="hidden lg:flex brand-side relative m-2 sm:m-4 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#18181b] to-[#23232b] p-6 sm:p-12 text-white flex-col justify-center">
              <div>
                <div className="mb-6 sm:mb-12 text-base sm:text-lg font-semibold uppercase text-white">
                  Crie sua conta
                </div>
                <h1 className="mb-2 sm:mb-4 text-3xl sm:text-6xl font-medium text-white">
                  Potencialize seu Trading
                </h1>
                <p className="mb-6 sm:mb-12 text-base sm:text-xl opacity-80 text-white">
                  Junte-se a milhares de traders que confiam na ISEVEN para maximizar seus resultados no mercado financeiro.
                </p>

                <div className="space-y-4 sm:space-y-6">
                  {[
                    {
                      icon: <svg width={16} height={16} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><path d="M14 3v7h-7" /></svg>,
                      title: 'Ferramentas Avançadas',
                      desc: 'Indicadores e gráficos profissionais para análise de mercado',
                    },
                    {
                      icon: <svg width={16} height={16} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
                      title: 'Comunidade de Traders',
                      desc: 'Colabore e compartilhe estratégias em tempo real',
                    },
                    {
                      icon: <svg width={16} height={16} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 15a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4" /><circle cx="9" cy="7" r="4" /></svg>,
                      title: 'Acesso em Nuvem',
                      desc: 'Gerencie suas operações de qualquer lugar',
                    },
                    {
                      icon: <svg width={16} height={16} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7c0 6 8 10 8 10z" /></svg>,
                      title: 'Segurança de Alto Nível',
                      desc: 'Proteção de dados e operações financeiras',
                    },
                  ].map(({ icon, title, desc }, i) => (
                    <div
                      key={i}
                      className="feature-item animate-fadeInUp flex items-center"
                      style={{ animationDelay: `${0.2 * (i + 1)}s` }}
                    >
                      <div className="mr-3 sm:mr-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-sm">
                        {icon}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm sm:text-base">{title}</div>
                        <div className="text-xs sm:text-sm opacity-70 text-white">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lado Direito */}
            <div className="flex flex-col justify-center p-4 sm:p-12 bg-[#18181b] w-full">
              <div className="mx-auto w-full max-w-md">
                <div className="mb-6 sm:mb-8 text-center">
                  <h2 className="text-2xl sm:text-3xl uppercase text-white">
                    Criar Conta
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-gray-400">
                    Preencha os dados abaixo para se registrar na plataforma
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="nome"
                        className="mb-2 block text-xs sm:text-sm font-medium uppercase text-white"
                      >
                        Nome
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="nome"
                          type="text"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          required
                          className="border-[#23232b] bg-[#23232b] text-white block w-full rounded-lg border py-3 pr-3 pl-10 text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                          placeholder="Digite seu nome"
                          autoComplete="given-name"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="sobrenome"
                        className="mb-2 block text-xs sm:text-sm font-medium uppercase text-white"
                      >
                        Sobrenome
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="sobrenome"
                          type="text"
                          value={sobrenome}
                          onChange={(e) => setSobrenome(e.target.value)}
                          required
                          className="border-[#23232b] bg-[#23232b] text-white block w-full rounded-lg border py-3 pr-3 pl-10 text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                          placeholder="Digite seu sobrenome"
                          autoComplete="family-name"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-xs sm:text-sm font-medium uppercase text-white"
                    >
                      E-mail
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-[#23232b] bg-[#23232b] text-white block w-full rounded-lg border py-3 pr-3 pl-10 text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        placeholder="Digite seu e-mail"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="telefone"
                      className="mb-2 block text-xs sm:text-sm font-medium uppercase text-white"
                    >
                      Telefone
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="telefone"
                        type="tel"
                        value={telefone}
                        onChange={(e) => setTelefone(formatPhoneBR(e.target.value))}
                        required
                        className="border-[#23232b] bg-[#23232b] text-white block w-full rounded-lg border py-3 pr-3 pl-10 text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        placeholder="(xx) xxxxx-xxxx"
                        autoComplete="tel"
                        inputMode="numeric"
                        pattern="\(\d{2}\) \d{5}-\d{4}"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-xs sm:text-sm font-medium uppercase text-white"
                    >
                      Senha
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-[#23232b] bg-[#23232b] text-white block w-full rounded-lg border py-3 pr-12 pl-10 text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        placeholder="Digite sua senha"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-xs sm:text-sm font-medium uppercase text-white"
                    >
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="border-[#23232b] bg-[#23232b] text-white block w-full rounded-lg border py-3 pr-12 pl-10 text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        placeholder="Confirme sua senha"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      id="terms"
                      type="checkbox"
                      className="border-[#23232b] text-[#3b82f6] bg-[#23232b] h-4 w-4 rounded focus:ring-2 focus:ring-[#3b82f6]"
                      checked={acceptedTerms}
                      onChange={() => setAcceptedTerms(!acceptedTerms)}
                      required
                    />
                    <label htmlFor="terms" className="ml-2 text-xs sm:text-sm text-gray-400 cursor-pointer select-none">
                      Aceito os{' '}
                      <a
                        href="#"
                        className="text-white underline hover:text-[#3b82f6] transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Termos de Uso
                      </a>
                      ,{' '}
                      <a
                        href="#"
                        className="text-white underline hover:text-[#3b82f6] transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Política de Privacidade
                      </a>{' '}
                      e confirmo ter +18 anos
                    </label>
                  </div>

                  {error && (
                    <div className="text-red-400 text-xs sm:text-sm">{error}</div>
                  )}

                  <button
                    type="submit"
                    className="login-btn relative flex w-full items-center justify-center rounded-lg px-4 py-3 text-xs sm:text-sm font-medium text-white transition-all duration-300 disabled:opacity-50"
                    disabled={loading || !isFormValid}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                        <span className="ml-2">Registrando...</span>
                      </>
                    ) : (
                      'Criar conta'
                    )}
                  </button>
                </form>

                <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-400">
                  Já possui uma conta?{' '}
                  <a href="/auth/login" className="text-white hover:text-[#3b82f6] transition-colors">
                    Entrar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
