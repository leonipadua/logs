import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/app",
        "/admin",
        "/api",
        "/login",
        "/trocar-senha",
        "/recuperar-senha",
        "/redefinir-senha",
        "/convite-expirado",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
