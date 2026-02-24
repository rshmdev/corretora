
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Landmark } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useAccount } from "@/context/account/AccountContext";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { account } = useAccount();

  const displayName = useMemo(() => {
    const first = (account as any)?.firstName ?? (account as any)?.first_name ?? "";
    const last = (account as any)?.lastName ?? (account as any)?.last_name ?? "";
    const full = `${String(first || "").trim()} ${String(last || "").trim()}`.trim();
    return (full || (account as any)?.name || "Administrador") as string;
  }, [account]);

  const avatarUrl = useMemo(() => {
    const fromAccount = (account as any)?.avatar ?? (account as any)?.photo ?? (account as any)?.avatarUrl ?? null;
    if (typeof fromAccount === "string" && fromAccount) return fromAccount;
    const initials = encodeURIComponent(displayName || "Admin");
    return `https://ui-avatars.com/api/?name=${initials}`;
  }, [account, displayName]);

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
    <header
      className="w-full bg-neutral-950 border-b border-neutral-800 px-4 py-2 flex items-center justify-between z-50 fixed top-0 left-0"
      style={{
        height: "64px",
        minHeight: "64px",
        maxHeight: "64px",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-2">
          <Landmark className="h-8 w-8 text-green-500" />
          <span className="text-white font-bold text-xl tracking-tight">
            Brokerly <span className="text-green-400">Admin</span>
          </span>
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 focus:outline-none"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-9 w-9 rounded-full border-2 border-green-400"
            />
            <span className="hidden sm:inline text-white font-medium">{displayName}</span>
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
              <a
                href="/app/admin"
                className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
              >
                Dashboard
              </a>
              <a
                href="/app/admin/entradas"
                className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
              >
                Entradas
              </a>
              <a
                href="/app/admin/saidas"
                className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
              >
                Saídas
              </a>
              <a
                href="/app/admin/users"
                className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
              >
                Usuários
              </a>
              <div className="border-t border-neutral-800 my-2" />
              <a
                href="/app/admin/profile"
                className="block px-4 py-2 text-gray-200 hover:bg-neutral-800 transition"
              >
                Meu Perfil
              </a>
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
