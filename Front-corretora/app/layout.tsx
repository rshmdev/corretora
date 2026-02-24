import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth";
import { AccountProvider } from "@/context/account/AccountContext";
import { WsProvider } from "@/context/ws/WsContext";
import ToastProvider from "./toast-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function fetchSiteInfo(): Promise<{ name?: string; description?: string }> {
  try {
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!api) return {};
    const resp = await fetch(`${api}/v1/admin/info`, { cache: 'no-store' });
    if (!resp.ok) return {};
    const json = await resp.json();
    if (!json?.status) return {};
    return { name: json?.data?.name, description: json?.data?.description };
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const info = await fetchSiteInfo();
  return {
    title: info.name || 'blackpearlbroker ',
    description: info.description || 'Plataforma',
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <WsProvider>
            <AccountProvider>
              <ToastProvider />
              {children}
            </AccountProvider>
          </WsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
