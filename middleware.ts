import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Middleware de proteção de rotas.
 *
 * Como o Firebase Auth SDK é client-side, não temos acesso direto ao token
 * no middleware do Next.js (server-side). A proteção principal acontece
 * no client component do /dashboard via onAuthStateChanged.
 *
 * Este middleware serve como camada extra:
 * - Redireciona a raiz "/" para "/auth"
 * - Pode ser expandido futuramente para verificar cookies de sessão
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Redireciona a raiz para /auth
    if (pathname === "/") {
        return NextResponse.redirect(new URL("/auth", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/"],
}
