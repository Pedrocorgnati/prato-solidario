# Backend Build Report

**Projeto:** prato-solidario
**Stack:** nextjs-api (Next.js 16 App Router)
**Data:** 2026-04-04
**Modo:** COMPLEMENTAR (frontend já existia)

---

## Notas Críticas — Next.js 16 / Prisma 7

| Mudança | Detalhe |
|---------|---------|
| `middleware.ts` → `proxy.ts` | Já existia no frontend — não foi tocado |
| `params` em route handlers | Promise — `await params` obrigatório (Next.js 16) |
| Prisma 7 datasource | `url` removido do schema.prisma → movido para `prisma.config.ts` |
| Prisma 7 client | Requer `PrismaPg` adapter no constructor |
| `Response.json()` | Usado ao invés de `NextResponse.json()` (padrão Web) |

---

## Mapeamento OpenAPI → Arquivo Gerado

| Path OpenAPI | Arquivo | Status |
|---|---|---|
| POST /auth/login | src/app/api/v1/auth/login/route.ts | CRIADO |
| POST /auth/logout | src/app/api/v1/auth/logout/route.ts | CRIADO |
| POST /auth/password-reset | src/app/api/v1/auth/password-reset/route.ts | CRIADO |
| POST /auth/password-update | src/app/api/v1/auth/password-update/route.ts | CRIADO |
| POST /auth/resend-verification | src/app/api/v1/auth/resend-verification/route.ts | CRIADO |
| GET /auth/session | src/app/api/v1/auth/session/route.ts | CRIADO |
| POST /users/register/donor-pf | src/app/api/v1/users/register/donor-pf/route.ts | CRIADO |
| POST /users/register/donor-restaurant | src/app/api/v1/users/register/donor-restaurant/route.ts | CRIADO |
| POST /users/register/marmitaria | src/app/api/v1/users/register/marmitaria/route.ts | CRIADO |
| POST /users/register/ong | src/app/api/v1/users/register/ong/route.ts | CRIADO |
| POST /users/register/receptor | src/app/api/v1/users/register/receptor/route.ts | CRIADO |
| POST /users/register/sponsor | src/app/api/v1/users/register/sponsor/route.ts | CRIADO |
| GET /users/me | src/app/api/v1/users/me/route.ts | CRIADO |
| PATCH /users/me | src/app/api/v1/users/me/route.ts | CRIADO |
| POST /users/me/deletion-request | src/app/api/v1/users/me/deletion-request/route.ts | CRIADO |
| GET /users/me/data-export | src/app/api/v1/users/me/data-export/route.ts | CRIADO |
| GET /users/{userId} | src/app/api/v1/users/[userId]/route.ts | CRIADO |
| GET /users | src/app/api/v1/users/route.ts | CRIADO |
| GET /users/me/addresses | src/app/api/v1/users/me/addresses/route.ts | CRIADO |
| POST /users/me/addresses | src/app/api/v1/users/me/addresses/route.ts | CRIADO |
| GET /users/me/addresses/{addressId} | src/app/api/v1/users/me/addresses/[addressId]/route.ts | CRIADO |
| PATCH /users/me/addresses/{addressId} | src/app/api/v1/users/me/addresses/[addressId]/route.ts | CRIADO |
| DELETE /users/me/addresses/{addressId} | src/app/api/v1/users/me/addresses/[addressId]/route.ts | CRIADO |
| POST /push-tokens | src/app/api/v1/push-tokens/route.ts | CRIADO |
| DELETE /push-tokens/{token} | src/app/api/v1/push-tokens/[token]/route.ts | CRIADO |
| GET /users/me/push-tokens | src/app/api/v1/users/me/push-tokens/route.ts | CRIADO |
| GET /geo/cep/{cep} | src/app/api/v1/geo/cep/[cep]/route.ts | CRIADO |

---

## Estrutura Gerada

### Infraestrutura
- `prisma/schema.prisma` — 4 models, 12 enums (Prisma 7 sem url no datasource)
- `prisma.config.ts` — datasource URL config (Prisma 7)
- `src/lib/prisma.ts` — PrismaClient singleton com PrismaPg adapter
- `src/lib/supabase/server.ts` — createSupabaseServerClient + createSupabaseAdminClient
- `src/lib/supabase/client.ts` — createSupabaseBrowserClient
- `.env.example` — variáveis de ambiente necessárias

### Constantes e Schemas
- `src/constants/errors.ts` — catálogo completo (VAL/SYS/AUTH/RATE/USER/GEO/PUSH)
- `src/schemas/auth.schema.ts` — login, password-reset, password-update, resend-verification
- `src/schemas/user.schema.ts` — 7 schemas de cadastro + updateUser
- `src/schemas/address.schema.ts` — createAddress, updateAddress
- `src/schemas/push-token.schema.ts` — registerPushToken

### Repositories
- `src/repositories/user.repository.ts` — CRUD + findAll com filtros
- `src/repositories/address.repository.ts` — CRUD + updateGeoPoint
- `src/repositories/push-token.repository.ts` — upsert, deactivate, findByUserId
- `src/repositories/audit-log.repository.ts` — log()

### Services
- `src/services/auth.service.ts` — Supabase Auth wrapper (signIn/signOut/resetPassword/updatePassword/session)
- `src/services/user.service.ts` — 6 fluxos de cadastro + updateUser + requestDeletion + exportUserData
- `src/services/geo.service.ts` — ViaCEP proxy + Mapbox geocoding (timeout + retry)
- `src/services/push-token.service.ts` — register/remove/getByUserId

### API Routes (27 handlers em 23 arquivos)
23 arquivos gerados cobrindo 100% dos endpoints do openapi.yaml

---

## Dependências Instaladas

| Pacote | Motivo |
|--------|--------|
| @supabase/supabase-js | Supabase Auth (admin operations) |
| @supabase/ssr | Supabase Server Client (cookies) |
| @prisma/adapter-pg | Prisma 7 adapter para PostgreSQL |
| pg + @types/pg | Driver PostgreSQL para o adapter |
| prisma (dev) | CLI para generate e migrate |
| @prisma/client | Prisma Client gerado |

---

## Stubs Pendentes para `/auto-flow execute`

Toda a lógica de negócio real dos **services** está implementada (não é stub):
- UserService: 6 cadastros, updateUser, requestDeletion, exportUserData
- AuthService: signIn, signOut, resetPassword, updatePassword, getSession
- GeoService: resolveAddress (ViaCEP), geocode (Mapbox)
- PushTokenService: register (upsert), remove, getByUserId

Os **Server Actions** existentes (`src/actions/*.ts`) ainda têm TODOs para integração Supabase — executar via `/auto-flow execute` por task.

---

## Próximos Passos

1. `/env-creation` — configurar `.env` com credenciais reais (Supabase, Mapbox)
2. `/db-migration-create` — gerar e rodar migrations (`npx prisma migrate dev`)
3. `/auto-flow execute [range]` — implementar Server Actions (substituir stubs nos `src/actions/`)
4. `proxy.ts` — substituir TODOs com Supabase real (sessão + role via cookie)
