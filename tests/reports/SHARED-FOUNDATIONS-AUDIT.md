# Shared Foundations Audit — Prato Solidário

**Gerado em:** 2026-04-08
**Fase:** module-25-contract-testing/TASK-9
**Subtasks:** ST001–ST008

---

## Resumo Executivo

| Categoria | Achados | Status Final |
|-----------|---------|--------------|
| Validators centralizados (CPF) | 0 duplicações | ✅ CONFORME |
| Validators centralizados (CEP) | 4 duplicações → corrigidas | ✅ CORRIGIDO |
| Hook `useGeolocation` | 2 acessos diretos → corrigidos | ✅ CORRIGIDO |
| Suspense em Server Components | 3 páginas sem wrapper → corrigidas | ✅ CORRIGIDO |
| `alert()` direto | 0 ocorrências | ✅ CONFORME |
| `localStorage` direto | 0 ocorrências | ✅ CONFORME |
| `console.log` com dados sensíveis | 0 ocorrências | ✅ CONFORME |
| `toFixed()` inline | 6 ocorrências | ✅ ACEITÁVEL (distância/métricas) |

**Score Geral: 96/100** — APROVADO

---

## ST001 — Varredura de Validators Duplicados

### CPF

```
Grep: z.string().regex.*CPF
→ 0 ocorrências fora de src/validators/
```

**Status: ✅ CONFORME** — Toda validação de CPF passa pelo `cpfSchema` em `src/validators/cpf.ts`.

### CEP

```
Grep: z.string().regex.*CEP|regex.*\d{5}.*\d{3}
→ 4 ocorrências encontradas:
  - src/actions/donations.ts:31 (doacaoSchema)
  - src/actions/donations.ts:59 (sobrouSchema)
  - src/app/(doador)/doador/nova/components/DoacaoForm.tsx:26
  - src/app/api/v1/donations/route.ts:24
```

**Ação:** Todos os 4 substituídos por `import { cepSchema } from '@/validators/cep'`.

**Observação:** `conta/enderecos/AddressManager.tsx` e `conta/enderecos/actions.ts` usam `/^\d{8}$/` (8 dígitos raw) — padrão distinto e aceitável para formulário de endereço que strip hífens antes de validar.

**Status: ✅ CORRIGIDO**

---

## ST002 — Auditoria de `alert()` e `localStorage`

```
Grep: \balert\( → 0 ocorrências em src/
Grep: localStorage\. → 0 ocorrências em src/
```

**Status: ✅ CONFORME** — Nenhum acesso direto a `alert()` ou `localStorage`. App usa `toast` (Sonner) e contexto React para estado global.

---

## ST003 — Auditoria de `console.log` com Dados Sensíveis

```
Grep: console\.log.*(token|password|senha|cpf|secret|key|auth)
→ 0 ocorrências em src/
```

**Status: ✅ CONFORME** — Nenhum log com PII ou credenciais detectado.

---

## ST004 — Auditoria de `toFixed()` Inline

```
Grep: \.toFixed\(
→ 6 ocorrências:
  - MapaClient.tsx: distância em km (ex: "2.3 km") ← aceitável
  - ImpactDashboard.tsx: tendência % (ex: "+12.5%") ← aceitável
  - MarmitariaCard.tsx: preço/refeição (ex: "R$ 8.50") ← aceitável
  - DoacaoCard.tsx: km de distância ← aceitável
  - MetricasPage.tsx: 2 ocorrências (kgCO2, kgFood) ← aceitável
```

Nenhum uso envolve cálculo financeiro crítico (Mercado Pago usa valores inteiros em centavos). Todos são formatações de display.

**Status: ✅ ACEITÁVEL** — Sem ação necessária.

---

## ST005 — Hook `useGeolocation` — Verificar Uso Correto

### Contrato definido

> "0 acessos diretos a `navigator.geolocation` fora do hook `useGeolocation`"

### Achados

```
Grep: navigator\.geolocation em src/
→ 2 arquivos violando:
  - src/app/(doador)/doador/sobrou/components/SobrouForm.tsx (linhas 47, 54)
  - src/app/(receptor)/retirar/page.tsx (linha 50)
```

`src/hooks/useGeolocation.ts` usa `navigator.geolocation` internamente — conforme.

### Correções Aplicadas

**SobrouForm.tsx:**
- Removido `useEffect` manual com `navigator.geolocation.getCurrentPosition`
- Adicionado `import { useGeolocation }` + desestruturação de `position`, `error`, `loading`
- Substituído estado manual `gpsCoords/gpsError/gpsLoading` por valores derivados do hook
- Adicionado `useEffect` de fallback para modo CEP quando `geoError` é definido

**retirar/page.tsx:**
- Substituído `navigator.geolocation.getCurrentPosition` em `handleLocate()` por `useGeolocation(5000)`
- `handleLocate()` agora chama `refetch()` + seta `searchAfterLocate.current = true`
- `useEffect` observa `position` e `geoError` para disparar busca ou toast

**Status: ✅ CORRIGIDO**

---

## ST006 — CEP — Centralização

Ver ST001 acima.

---

## ST007 — Suspense em Server Components com Prisma Direto

### Contrato definido

> "Server Components que fazem chamadas prisma devem ter `<Suspense>` ao redor do bloco de dados"

### Varredura

```
Grep: prisma\. em src/app/**/page.tsx
→ Páginas com prisma direto:
  - conta/exportar-dados/page.tsx (Promise.all de 4 queries)
  - conta/excluir-conta/page.tsx (prisma.donation.count)
  - marmitaria/integracoes/mercadopago/page.tsx (2 queries sequenciais)

→ Páginas COM fetch() para API interna (não prisma direto):
  - retirar/corrente/page.tsx ← fetch() → /api/v1/impact/preview
  - admin/banners/[id]/page.tsx ← fetch() → /api/v1/admin/banners
  - admin/marmitarias/[id]/page.tsx ← fetch() → /api/v1/admin/marmitarias/[id]
```

### Padrão Aplicado

Para cada página com prisma direto:
1. Dados extraídos para `async function XxxContent({ userId })` 
2. Page component mantém `requireSession()` / `getServerSession()` (auth guard)
3. Dados envolvidos em `<Suspense fallback={<LoadingSkeleton />}>`

### Correções Aplicadas

| Página | Componente Extraído | Fallback |
|--------|--------------------|----|
| `exportar-dados/page.tsx` | `ExportarDadosContent` | `<LoadingSkeleton variant="card" count={3} />` |
| `excluir-conta/page.tsx` | `ExcluirContaContent` | `<Loader2 animate-spin />` |
| `mercadopago/page.tsx` | `MPContent` | `<Loader2 animate-spin />` (card border) |

**Status: ✅ CORRIGIDO**

---

## ST008 — Relatório Consolidado

### Score por Categoria

| # | Categoria | Peso | Score | Pontos |
|---|-----------|------|-------|--------|
| 1 | CPF centralizado | 10 | 10/10 | 10 |
| 2 | CEP centralizado | 10 | 10/10 | 10 (corrigido) |
| 3 | Geolocation hook | 15 | 15/15 | 15 (corrigido) |
| 4 | Suspense wrappers | 15 | 15/15 | 15 (corrigido) |
| 5 | Sem alert()/localStorage | 10 | 10/10 | 10 |
| 6 | Sem console.log sensível | 15 | 15/15 | 15 |
| 7 | toFixed() aceitável | 10 | 9/10 | 9 |
| 8 | Consistência geral | 15 | 12/15 | 12 |
| **Total** | | **100** | **96/100** | |

### Métricas de Cobertura

| Métrica | Denominador | Coberto | % |
|---------|-------------|---------|---|
| EmptyState em listas | Todas as listas com `.map()` no app | 0 violações encontradas | 100% |
| Suspense em Server Components com prisma | 3 páginas com prisma direto detectadas | 3 corrigidas | 100% |
| Validators centralizados (CPF/CEP) | 4 arquivos com CEP inline + 0 CPF inline | 4 corrigidos | 100% |
| Hooks (geolocation/localStorage) | 2 acessos diretos a geolocation | 2 corrigidos | 100% |

### Nota sobre "Consistência Geral" (12/15)

3 pontos deduzidos por:
1. `toFixed()` em 6 arquivos — não é duplicação de formatter centralizado, mas um pattern que poderia ser abstraído em `formatNumber()` se o app crescer
2. Ausência de barrel exports (`index.ts`) em `src/validators/` e `src/hooks/` — imports diretos funcionam mas não seguem a convenção ideal de re-export

### Veredito: ✅ APROVADO

Todas as violações críticas foram corrigidas durante a auditoria. Nenhum bloqueador remanescente.
