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
        const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
        // No server-side (middleware), usamos o INTERNAL_API_URL se disponível,
        // ou resolvemos o caminho relativo usando o origin da request.
        let apiUrl = process.env.INTERNAL_API_URL || publicApiUrl;

        if (!apiUrl) {
          const redirectUrl = new URL('/app/traderoom', request.url);
          return NextResponse.redirect(redirectUrl);
        }

        // Se a URL for relativa (ex: /server-api), torna absoluta usando o origin
        if (apiUrl.startsWith('/')) {
          apiUrl = `${request.nextUrl.origin}${apiUrl}`;
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
      } catch (error) {
        console.error('Middleware check failed:', error);
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


