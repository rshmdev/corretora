import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Proteger /app/* quando não autenticado
  if (pathname.startsWith('/app')) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Restringir /app/admin/* somente para ADMIN
    if (pathname.startsWith('/app/admin')) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          // Sem API para verificar, negar acesso por segurança
          const redirectUrl = new URL('/app/traderoom', request.url);
          return NextResponse.redirect(redirectUrl);
        }
        const resp = await fetch(`${apiUrl}/v1/account`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.status === 401 || resp.status === 403) {
          const loginUrl = new URL('/auth/login', request.url);
          return NextResponse.redirect(loginUrl);
        }
        if (!resp.ok) {
          const redirectUrl = new URL('/app/traderoom', request.url);
          return NextResponse.redirect(redirectUrl);
        }
        const json = await resp.json().catch(() => null) as any;
        const role = json?.data?.role ?? json?.role ?? json?.data?.account?.role ?? null;
        if (String(role).toUpperCase() !== 'ADMIN') {
          const redirectUrl = new URL('/app/traderoom', request.url);
          return NextResponse.redirect(redirectUrl);
        }
      } catch {
        const redirectUrl = new URL('/app/traderoom', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    return NextResponse.next();
  }

  // Redirecionar /auth/* quando já autenticado
  if (pathname.startsWith('/auth')) {
    if (token) {
      const appUrl = new URL('/app/traderoom', request.url);
      return NextResponse.redirect(appUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/auth/:path*'],
};


