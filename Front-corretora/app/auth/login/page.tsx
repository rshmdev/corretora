
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
  Palette,
  Users,
  Cloud,
  ShieldCheck,
  Github,
} from 'lucide-react';

export default function SignInPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isStrongPassword = (value: string) => value.trim().length >= 6;
  const isFormValid = isValidEmail(email) && isStrongPassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isFormValid) {
      const msg = 'Preencha e-mail válido e senha com 6+ caracteres.';
      setError(msg);
      toast.error(msg);
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg = 'Falha no login. Verifique suas credenciais.';
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
          <div className="flex flex-col min-h-[600px] md:min-h-[700px] md:grid md:grid-cols-2">
            {/* Lado Esquerdo (esconde no mobile) */}
            <div className="hidden md:flex brand-side relative p-6 sm:p-8 md:p-12 m-0 md:m-4 rounded-none md:rounded-3xl bg-gradient-to-br from-[#18181b] to-[#23232b] text-white items-center">
              <div className="w-full">
                <div className="mb-8 sm:mb-10 md:mb-12 text-base sm:text-lg font-semibold uppercase text-white">
                  blackpearlbroker
                </div>
                <h1 className="mb-3 sm:mb-4 text-3xl sm:text-5xl md:text-6xl font-medium text-white leading-tight">
                  Potencialize seu Trading
                </h1>
                <p className="mb-8 sm:mb-10 md:mb-12 text-base sm:text-lg md:text-xl opacity-80 text-white">
                  Junte-se a milhares de traders que confiam na ISEVEN para maximizar seus resultados no mercado financeiro.
                </p>

                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {[
                    {
                      icon: <Palette size={16} color="#fff" />,
                      title: 'Ferramentas Avançadas',
                      desc: 'Indicadores e gráficos profissionais para análise de mercado',
                    },
                    {
                      icon: <Users size={16} color="#fff" />,
                      title: 'Comunidade de Traders',
                      desc: 'Colabore e compartilhe estratégias em tempo real',
                    },
                    {
                      icon: <Cloud size={16} color="#fff" />,
                      title: 'Acesso em Nuvem',
                      desc: 'Gerencie suas operações de qualquer lugar',
                    },
                    {
                      icon: <ShieldCheck size={16} color="#fff" />,
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
            <div className="flex flex-col justify-center p-6 sm:p-8 md:p-12 bg-[#18181b] w-full">
              <div className="mx-auto w-full max-w-md">
                <div className="mb-6 sm:mb-8 text-center">
                  <h2 className="text-2xl sm:text-3xl uppercase text-white">
                    Bem-vindo de volta
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-gray-400">
                    Faça login para acessar sua área de trading
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
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
                        className="border-[#23232b] bg-[#23232b] text-white block w-full rounded-lg border py-3 pr-3 pl-10 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        placeholder="Digite seu e-mail"
                        autoComplete="username"
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
                        className="border-[#23232b] bg-[#23232b] text-white block w-full rounded-lg border py-3 pr-12 pl-10 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
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

                  {error && (
                    <div className="text-red-400 text-xs sm:text-sm">{error}</div>
                  )}

                  <button
                    type="submit"
                    className="login-btn relative flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-white transition-all duration-300 disabled:opacity-50"
                    disabled={loading || !isFormValid}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                        <span className="ml-2">Entrando...</span>
                      </>
                    ) : (
                      'Entrar na plataforma'
                    )}
                  </button>

                  <div className="relative text-center text-xs sm:text-sm text-gray-500">
                    <div className="absolute inset-0 flex items-center">
                      <div className="border-[#23232b] w-full border-t"></div>
                    </div>
                    <span className="relative px-2 bg-[#18181b]">OU</span>
                  </div>
                </form>

                <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-400">
                  Não possui uma conta?{' '}
                  <a href="/auth/register" className="text-white hover:text-[#3b82f6] transition-colors">
                    Cadastre-se gratuitamente
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
