import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/contato`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/termos`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
