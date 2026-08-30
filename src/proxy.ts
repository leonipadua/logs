import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

function buildCsp(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseWs = supabaseUrl.replace(/^https:/, "wss:");

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' data: blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' ${supabaseUrl} ${supabaseWs};
    frame-ancestors 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);
  return { requestHeaders, cspHeader };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { requestHeaders, cspHeader } = buildCsp(request);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request: { headers: requestHeaders } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() revalida contra o servidor — não apenas a presença do cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isTrocarSenha = pathname === "/trocar-senha";
  const isProtegida = pathname.startsWith("/app") || pathname.startsWith("/admin");

  if (!user && (isProtegida || isTrocarSenha)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    response = NextResponse.redirect(loginUrl);
  } else if (user) {
    let mustChangePassword = false;
    if (isProtegida || isTrocarSenha || pathname === "/login") {
      const { data: perfil } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("id", user.id)
        .single();
      mustChangePassword = perfil?.must_change_password ?? false;
    }

    if (isProtegida && mustChangePassword) {
      response = NextResponse.redirect(new URL("/trocar-senha", request.url));
    } else if (isProtegida && pathname.startsWith("/admin") && user.app_metadata?.role !== "admin") {
      response = NextResponse.redirect(new URL("/app", request.url));
    } else if (isTrocarSenha && !mustChangePassword) {
      response = NextResponse.redirect(new URL("/app", request.url));
    } else if (pathname === "/login" && !mustChangePassword) {
      response = NextResponse.redirect(new URL("/app", request.url));
    } else if (pathname === "/login" && mustChangePassword) {
      response = NextResponse.redirect(new URL("/trocar-senha", request.url));
    }
  }

  response.headers.set("Content-Security-Policy", cspHeader);
  // /indique é público de propósito, mas não deve ser indexado: a vitrine é
  // para quem recebeu o link de um cliente, não para busca orgânica.
  if (isProtegida || pathname.startsWith("/api") || pathname.startsWith("/indique")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
