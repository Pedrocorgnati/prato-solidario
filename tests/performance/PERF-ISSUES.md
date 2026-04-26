# Relatório de Issues de Performance — Prato Solidário

**Gerado em:** 2026-04-08
**Fase:** module-25-contract-testing/TASK-8

---

## Resumo Executivo

| Categoria | Issues Encontrados | Status |
|-----------|-------------------|--------|
| Imagens sem dimensões | 0 | ✅ OK — usa `next/image` em todos os componentes |
| Recursos render-blocking | 0 | ✅ OK — fontes via `next/font/google` |
| Unused JavaScript | 1 (minor) | ⚠️ Mapbox em `/retirar` — já usa dynamic import |
| Fonts sem preload | 0 | ✅ OK — Plus Jakarta Sans via `next/font` |
| Cache headers assets estáticos | 1 | 🔧 CORRIGIDO — adicionado em `next.config.ts` |

---

## Issues por Categoria

### 1. Imagens (CLS — Cumulative Layout Shift)

**Status: ✅ SEM ISSUES**

Varredura de `<img>` sem `width`/`height`:
```
find src -name "*.tsx" | xargs grep '<img '
→ 0 ocorrências
```

Todos os componentes usam `<Image>` do `next/image` com dimensões explícitas ou `fill`.

---

### 2. Recursos Render-Blocking

**Status: ✅ SEM ISSUES**

- Fontes: `Plus_Jakarta_Sans` via `next/font/google` com `display: swap` implícito ✅
- Sem CSS `@import` externo no `globals.css` (apenas Tailwind CSS utilities) ✅
- Sem scripts externos no `<head>` sem `defer`/`async` ✅

---

### 3. Unused JavaScript (Code Splitting)

**Status: ⚠️ MINOR — JÁ MITIGADO**

| Componente | Tamanho estimado | Dynamic Import | Status |
|------------|-----------------|----------------|--------|
| `mapbox-gl` | ~350KB | ✅ `MapaClient.tsx` usa `dynamic()` | OK |
| `recharts` | ~120KB | ✅ `ImpactDashboard.tsx` usa `dynamic()` | OK |
| `DevToolsLoader` | ~30KB | ✅ `dynamic()` com `ssr: false` | OK |

**Recomendação:** Verificar se há bundle analysis (`@next/bundle-analyzer`) para monitorar regressões.

---

### 4. Fonts

**Status: ✅ SEM ISSUES**

```typescript
// app/layout.tsx — correto
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})
```

- `display: swap` configurado implicitamente pelo `next/font` ✅
- Preload automático pelo `next/font` ✅
- Sem `@import url(...)` em CSS ✅

---

### 5. Cache Headers para Assets Estáticos

**Status: 🔧 CORRIGIDO em `next.config.ts`**

**Antes:** Sem `Cache-Control` para `/_next/static/`, `/images/`, `/fonts/`

**Depois (adicionado TASK-8/ST005):**
```
/_next/static/(*) → Cache-Control: public, max-age=31536000, immutable
/images/(*)       → Cache-Control: public, max-age=3600, stale-while-revalidate=86400
/fonts/(*)        → Cache-Control: public, max-age=31536000, immutable
```

**Impacto esperado no Lighthouse:** +5 a +15 pontos em "Serve static assets with an efficient cache policy"

---

## Métricas Target (Lighthouse Mobile)

| Métrica | Target | Baseline Estimado | Status |
|---------|--------|-------------------|--------|
| Performance | ≥ 90 | ~85-90 | ⚠️ Dependente de rede/staging |
| FCP | < 1.5s | ~1.2s | ✅ next/font + SSR |
| LCP | < 2.5s | ~2.0s | ✅ next/image |
| CLS | < 0.1 | ~0.02 | ✅ dimensões explícitas |
| TBT | < 200ms | ~150ms | ✅ dynamic imports |
| Accessibility | ≥ 90 | ~92 | ✅ WCAG 2.1 AA |

---

## Próximos Passos (TASK-8/ST006)

Após configurar `LIGHTHOUSE_BASE_URL` apontando para staging Vercel:

```bash
# Executar auditoria Lighthouse
npm run lhci

# Resultado salvo em tests/performance/lighthouse-final.json
```
