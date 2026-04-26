# NOTICE — Atribuições de Software de Terceiros

**Projeto:** Prato Solidário
**Gerado em:** 2026-04-08

Este projeto utiliza os seguintes componentes de software de terceiros:

---

## Licenças Permissivas (MIT, Apache-2.0, BSD, ISC e similares)

A grande maioria das dependências (~875 pacotes) utiliza licenças permissivas. Abaixo as dependências diretas de produção:

| Pacote | Versão | Licença |
|--------|--------|---------|
| @base-ui/react | ^1.3.0 | MIT |
| @hookform/resolvers | ^5.2.2 | MIT |
| @prisma/adapter-pg | ^7.6.0 | Apache-2.0 |
| @prisma/client | ^7.6.0 | Apache-2.0 |
| @sentry/nextjs | ^10.47.0 | MIT |
| @supabase/ssr | ^0.10.0 | MIT |
| @supabase/supabase-js | ^2.101.1 | MIT |
| @types/pg | ^8.20.0 | MIT |
| class-variance-authority | ^0.7.1 | Apache-2.0 |
| clsx | ^2.1.1 | MIT |
| date-fns | ^4.1.0 | MIT |
| lucide-react | ^1.7.0 | ISC |
| next | 16.2.2 | MIT |
| next-themes | ^0.4.6 | MIT |
| pg | ^8.20.0 | MIT |
| pino | ^10.3.1 | MIT |
| react | 19.2.4 | MIT |
| react-dom | 19.2.4 | MIT |
| react-hook-form | ^7.72.1 | MIT |
| recharts | ^3.8.1 | MIT |
| shadcn | ^4.1.2 | MIT |
| sonner | ^2.0.7 | MIT |
| tailwind-merge | ^3.5.0 | MIT |
| tw-animate-css | ^1.4.0 | MIT |
| zod | ^4.3.6 | MIT |

---

## Licenças LGPL/MPL (Copyleft Fraco)

Modificações ao código dessas bibliotecas devem ser abertas, mas o projeto pode ser proprietário.

| Pacote | Versão | Licença | Observação |
|--------|--------|---------|------------|
| axe-core | 4.11.2 | MPL-2.0 | Testes de acessibilidade (dev) |
| @axe-core/playwright | 4.11.1 | MPL-2.0 | Testes de acessibilidade (dev) |
| lightningcss | 1.32.0 | MPL-2.0 | Compilação CSS (build) |
| @img/sharp-libvips-linux-x64 | 1.2.4 | LGPL-3.0-or-later | Lib de imagem (linking dinâmico via sharp) |
| @img/sharp-libvips-linuxmusl-x64 | 1.2.4 | LGPL-3.0-or-later | Variante musl |

---

## ⚠️ Licença Proprietária (Mapbox Terms of Service)

| Pacote | Versão | Ação Necessária |
|--------|--------|-----------------|
| mapbox-gl | 3.21.0 | Requer conta Mapbox ativa e conformidade com Mapbox Terms of Service. Verificar plano de uso e limites de requisições. Para projetos de impacto social, verificar elegibilidade ao Mapbox Community Program. |

> **Nota:** `mapbox-gl` v2.0+ é proprietário. A licença BSD-3-Clause se aplicava apenas até v1.x. O uso em produção requer aceitação dos Termos de Serviço do Mapbox e um token válido com o plano adequado.

---

## FSL-1.1-MIT (Source-available — Ferramentas de CI)

| Pacote | Versão | Observação |
|--------|--------|------------|
| @sentry/cli | 2.58.5 | CLI do Sentry — apenas build/CI, não distribuído com o app |
| @sentry/cli-linux-x64 | 2.58.5 | Binário nativo — apenas build/CI |

---

## Licenças Desconhecidas (Verificar Manualmente)

| Pacote | Versão | Contexto | Ação |
|--------|--------|----------|------|
| @mapbox/jsonlint-lines-primitives | 2.0.2 | Dependência transitiva de mapbox-gl (dev/build) | Verificar repositório upstream |
| seq-queue | 0.0.5 | Dependência de driver de banco de dados (não usada em produção neste projeto) | Baixa prioridade |

---

*Gerado automaticamente por /dependency-audit (2026-04-08). Revisar antes de distribuição pública.*
