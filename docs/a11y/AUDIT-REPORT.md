# A11y Audit Report — Prato Solidario

**Versao:** 1.0
**Data:** 2026-04-21
**Responsavel:** _pendente — preencher apos audit manual_
**Padrao:** WCAG 2.1 AA

## Escopo

- `/` (landing)
- `/retirar` (fluxo critico — publico vulneravel)
- `/cadastro`

## Metodologia

1. Automacao: `@axe-core/playwright` via `npm run test:a11y` (tags wcag2a+aa + wcag21a+aa)
2. Manual: NVDA (Windows) ou VoiceOver (macOS) em `/retirar`
3. Visual: Chrome zoom 200% — verificar sem scroll horizontal

## Resultado do scan automatizado

> Rodar `npm run test:a11y` e anexar output aqui.

| Pagina | Violations (serious/critical) | Status |
|--------|-------------------------------|--------|
| /          | _pendente_ | _pendente_ |
| /retirar   | _pendente_ | _pendente_ |
| /cadastro  | _pendente_ | _pendente_ |

## Audit manual com leitor de tela

### /retirar — percurso

| Etapa | Elemento | Anunciado corretamente? | Problema |
|-------|----------|-------------------------|----------|
| 1. Entrar na pagina | `<h1>` | ? | |
| 2. Localizacao (CEP/geo) | input | ? | |
| 3. Informar grupo familiar | input numerico | ? | |
| 4. Solicitar refeicao | botao primario | ? | |
| 5. Receber codigo | area de resultado | ? | |
| 6. Confirmar | botao secundario | ? | |

### Zoom 200%

- [ ] Sem scroll horizontal
- [ ] Botoes clicaveis
- [ ] Texto legivel

## Violations corrigidas

_Preencher apos ST003._

## Violations aceitas com justificativa

_Somente `moderate`/`minor` podem ser aceitas com justificativa._

## Screenshots

Anexar em `docs/a11y/screenshots/`.
