import React from "react";

const icons = {
  dashboard: (
    <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" />
      <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" />
      <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" />
      <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" />
    </svg>
  ),
  entradas: (
    <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M12 19V5M5 12l7 7 7-7" stroke="currentColor" />
    </svg>
  ),
  saidas: (
    <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M12 5v14M19 12l-7-7-7 7" stroke="currentColor" />
    </svg>
  ),
  users: (
    <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" stroke="currentColor" />
      <path d="M4 20c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" />
    </svg>
  ),
  settings: (
    <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M3 12h6M15 12h6M12 3v6M12 15v6" stroke="currentColor" />
      <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" />
      <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" />
      <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" />
      <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" />
    </svg>
  ),
};

const adminSidebarItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: icons.dashboard,
    href: "/app/admin",
  },
  {
    key: "entradas",
    label: "Entradas",
    icon: icons.entradas,
    href: "/app/admin/entradas",
  },
  {
    key: "saidas",
    label: "Saídas",
    icon: icons.saidas,
    href: "/app/admin/saidas",
  },
  {
    key: "users",
    label: "Usuários",
    icon: icons.users,
    href: "/app/admin/users",
  },
  {
    key: "settings",
    label: "Configurações",
    icon: icons.settings,
    href: "/app/admin/settings",
  },
];

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <div className="relative flex items-center group">
      {children}
      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 whitespace-nowrap rounded bg-neutral-800 px-3 py-1 text-xs text-gray-100 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shadow-lg border border-neutral-700">
        {text}
      </span>
    </div>
  );
}

export default function AdminSidebar() {
  const headerHeightDesktop = 64; // px

  return (
    <>
      <aside
        className={`
          fixed
          left-0
          w-24
          bg-neutral-950
          border-r border-neutral-800
          flex flex-col items-center
          py-8
          z-30
          transition-transform
          duration-200
          sm:translate-x-0
        `}
        style={{
          top: `${headerHeightDesktop}px`,
          height: `calc(100vh - ${headerHeightDesktop}px)`,
          width: "6rem",
          minWidth: "6rem",
          maxWidth: "6rem",
        }}
      >
        <nav className="flex flex-col gap-4 w-full items-center">
          {adminSidebarItems.map((item) => (
            <Tooltip key={item.key} text={item.label}>
              <a
                href={item.href}
                className="flex flex-col items-center w-16 h-16 justify-center rounded-xl text-gray-300 hover:bg-neutral-900 hover:text-white transition outline-none"
                tabIndex={0}
                aria-label={item.label}
                style={{ textDecoration: "none" }}
              >
                {item.icon}
              </a>
            </Tooltip>
          ))}
        </nav>
        <div className="mt-auto pt-10 text-xs text-gray-500 text-center w-full">
          Admin &copy; {new Date().getFullYear()}
        </div>
      </aside>
      <style jsx>{`
        @media (max-width: 640px) {
          aside {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
