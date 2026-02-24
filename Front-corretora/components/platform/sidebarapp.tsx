import React, { useState } from "react";

const icons = {
  traderoom: (
    <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" />
      <path d="M16 3v4M8 3v4" stroke="currentColor" />
    </svg>
  ),
  operacoes: (
    <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" />
      <path d="M16 3v4M8 3v4" stroke="currentColor" />
    </svg>
  ),
  historico: (
    <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <path d="M12 7v5l3 3" stroke="currentColor" />
    </svg>
  ),
  melhores: (
    <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" stroke="currentColor" />
    </svg>
  ),
  copytrader: (
    <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" />
      <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" opacity="0.4" />
    </svg>
  )
  // suporte: (
  //   <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
  //     <circle cx="12" cy="12" r="10" stroke="currentColor" />
  //     <path d="M12 16h.01M12 8v2a2 2 0 0 1 2 2c0 1.105-1.343 2-3 2" stroke="currentColor" />
  //   </svg>
  // ),
};

const sidebarItems = [
  /*
    {
      key: "operacoes",
      label: "Operações Abertas",
      showPanel: false,
      icon: icons.operacoes,
      href: "/app/open-trading",
    },
     */
  {
    key: "traderoom",
    label: "Traderoom",
    showPanel: false,
    icon: icons.traderoom,
    href: "/app/traderoom",
  },
  {
    key: "historico",
    label: "Histórico de Trading",
    showPanel: false,
    icon: icons.historico,
    href: "/app/trading-history",
  },
  {
    key: "melhores",
    label: "Melhores Traders",
    showPanel: false,
    href: "/app/best-traders",
    icon: icons.melhores,
  },
  /*
  {
    key: "copytrader",
    label: "Copy Trader",
    showPanel: false,
    href: "/app/copy-trader",
    icon: icons.copytrader,
  }, */
  // {
  //   key: "suporte",
  //   label: "Suporte",
  //   showPanel: false,
  //   href: "/app/support",
  //   icon: icons.suporte,
  // },
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

export default function SidebarApp() {

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
          {sidebarItems.map((item) =>
            item.showPanel ? (
              <Tooltip key={item.key} text={item.label}>
                <button
                  className={`
                    flex flex-col items-center w-16 h-16 justify-center rounded-xl transition
                    text-gray-300 hover:bg-neutral-900 hover:text-white focus:bg-neutral-900 focus:text-white
                    outline-none
                  `}
                  tabIndex={0}
                  aria-label={item.label}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  {item.icon}
                </button>
              </Tooltip>
            ) : (
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
            )
          )}
        </nav>
        <div className="mt-auto pt-10 text-xs text-gray-500 text-center w-full">
          © {new Date().getFullYear()}
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
