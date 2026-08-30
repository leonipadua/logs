import type { NextConfig } from "next";
import path from "node:path";

const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  // Ancora a raiz do Turbopack neste projeto: sem isso o Next tenta inferir a
  // raiz do workspace subindo diretórios até achar um lockfile e acaba
  // resolvendo para C:\Users\leoni (fora do repositório git), o que faz o
  // Turbopack varrer uma árvore de arquivos muito maior e mais lenta a cada
  // build — sintoma observado como "Slow filesystem detected" e timeouts do
  // jest-worker ("Jest worker encountered N child process exceptions").
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
