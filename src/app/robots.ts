import type { MetadataRoute } from "next"

/**
 * robots.txt — permite indexação de rotas públicas, bloqueia admin/api/dashboard.
 * @see module-18-landing-page/TASK-3/ST005
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pratosolidario.com.br"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/doador", "/marmitaria", "/perfil", "/conta-excluida"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
