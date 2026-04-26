#!/usr/bin/env bash
# bootstrap.sh — Setup completo do ambiente local para Prato Solidário
# Gerado por /dev-bootstrap-create (SystemForge F8)
# Uso: ./scripts/bootstrap.sh [--reset|--health]
set -euo pipefail

# ═════════════════════════════════════════════════════════════════════════════
# CORES E LOGGING
# ═════════════════════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${BLUE}[bootstrap]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*" >&2; }
box()  { echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# ═════════════════════════════════════════════════════════════════════════════
# PRÉ-REQUISITOS
# ═════════════════════════════════════════════════════════════════════════════

check_prereqs() {
  log "Verificando pré-requisitos..."
  local missing=()

  # git
  command -v git >/dev/null 2>&1 || missing+=("git")

  # node (pode estar em Docker, mas verificamos local também)
  if ! command -v node >/dev/null 2>&1; then
    warn "node não detectado localmente — será usado via Docker"
  else
    ok "node $(node -v | cut -d'v' -f2) encontrado"
  fi

  # pnpm (via corepack)
  if ! command -v pnpm >/dev/null 2>&1; then
    if command -v corepack >/dev/null 2>&1; then
      log "Habilitando pnpm via corepack..."
      corepack enable pnpm 2>/dev/null || true
    else
      missing+=("pnpm")
    fi
  else
    ok "pnpm $(pnpm -v) encontrado"
  fi

  # docker
  command -v docker >/dev/null 2>&1 || missing+=("docker")

  # docker compose (V2)
  docker compose version >/dev/null 2>&1 || missing+=("docker-compose")

  if [ ${#missing[@]} -gt 0 ]; then
    err "Faltando pré-requisitos: ${missing[*]}"
    err ""
    err "Instale os pré-requisitos acima:"
    err "  • git: https://git-scm.com"
    err "  • node: https://nodejs.org (v20+)"
    err "  • pnpm: corepack enable pnpm"
    err "  • docker: https://docker.com"
    exit 1
  fi

  ok "Todos os pré-requisitos verificados"
}

# ═════════════════════════════════════════════════════════════════════════════
# .env E CONFIGURAÇÃO
# ═════════════════════════════════════════════════════════════════════════════

ensure_env() {
  log "Verificando arquivo .env..."

  if [ -f .env ]; then
    ok ".env já existe"
    return
  fi

  if [ -f .env.example ]; then
    log "Criando .env a partir de .env.example..."
    cp .env.example .env
    ok ".env criado"
    warn "Revise .env e preencha valores sensíveis (tokens, senhas) antes de continuar"
    return
  fi

  warn ".env não encontrado e sem template — valores sensíveis devem ser configurados manualmente"
}

# ═════════════════════════════════════════════════════════════════════════════
# DEPENDÊNCIAS
# ═════════════════════════════════════════════════════════════════════════════

install_deps() {
  log "Instalando dependências com pnpm..."

  if [ ! -f pnpm-lock.yaml ]; then
    warn "pnpm-lock.yaml não encontrado — usando fallback para npm"
    npm install --legacy-peer-deps
  else
    pnpm install --frozen-lockfile
  fi

  ok "Dependências instaladas"
}

# ═════════════════════════════════════════════════════════════════════════════
# PRISMA (geração do cliente)
# ═════════════════════════════════════════════════════════════════════════════

generate_prisma() {
  log "Gerando cliente Prisma..."
  pnpm exec prisma generate
  ok "Cliente Prisma gerado"
}

# ═════════════════════════════════════════════════════════════════════════════
# DOCKER COMPOSE
# ═════════════════════════════════════════════════════════════════════════════

start_docker() {
  log "Subindo serviços Docker..."

  if ! docker compose ps >/dev/null 2>&1; then
    err "Docker Compose não está configurado neste diretório"
    err "Verifique se docker-compose.yml existe"
    return 1
  fi

  docker compose up -d
  ok "Containers iniciados em modo detach"

  log "Aguardando health checks dos serviços (até 60s)..."
  local max_wait=60
  local elapsed=0

  while [ $elapsed -lt $max_wait ]; do
    # Verificar se há containers healthy
    if docker compose ps --format json 2>/dev/null | \
       grep -q '"Health":"healthy"' 2>/dev/null; then
      ok "Serviços saudáveis"
      return 0
    fi

    # Verificar se todos os containers estão rodando (sem health check)
    local total=$(docker compose ps --format json 2>/dev/null | grep -c '"State":"running"' || echo 0)
    local expected=$(docker compose config --format json 2>/dev/null | grep -c '"image"' || echo 0)

    if [ "$total" -ge "$expected" ] && [ "$total" -gt 0 ]; then
      ok "Serviços rodando (health checks OK ou N/A)"
      return 0
    fi

    sleep 2
    elapsed=$((elapsed + 2))
  done

  warn "Timeout esperando health checks após ${max_wait}s"
  warn "Containers podem estar em inicialização — verifique com: docker compose ps"
  return 0
}

stop_docker() {
  log "Parando serviços Docker..."
  docker compose down
  ok "Serviços parados"
}

clean_docker() {
  log "Limpando volumes Docker..."
  docker compose down -v
  ok "Volumes removidos"
}

# ═════════════════════════════════════════════════════════════════════════════
# MIGRATIONS
# ═════════════════════════════════════════════════════════════════════════════

run_migrations() {
  log "Executando migrations Prisma..."

  # Aguardar banco de dados estar pronto
  log "Aguardando banco de dados estar acessível..."
  local db_ready=0
  local max_wait=30
  local elapsed=0

  while [ $elapsed -lt $max_wait ]; do
    if pnpm exec prisma db execute --stdin <<< "SELECT 1;" >/dev/null 2>&1; then
      db_ready=1
      break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done

  if [ $db_ready -eq 0 ]; then
    warn "Banco de dados não está acessível após ${max_wait}s"
    warn "Você pode executar migrations manualmente com: pnpm exec prisma migrate deploy"
    return 1
  fi

  # Executar migrations
  pnpm exec prisma migrate deploy
  ok "Migrations aplicadas"
}

# ═════════════════════════════════════════════════════════════════════════════
# SEEDS
# ═════════════════════════════════════════════════════════════════════════════

run_seeds() {
  log "Executando seeds..."

  if ! pnpm db:seed; then
    warn "Seeds falharam — verifique prisma/seed.ts"
    return 1
  fi

  ok "Seeds aplicados"
}

# ═════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK (LEVE)
# ═════════════════════════════════════════════════════════════════════════════

check_health() {
  log "Verificando saúde do ambiente..."
  local errors=0

  # .env
  if [ -f .env ]; then
    ok ".env presente"
  else
    warn ".env ausente"
    errors=$((errors + 1))
  fi

  # node_modules
  if [ -d node_modules ]; then
    ok "Dependências instaladas"
  else
    warn "node_modules não encontrado"
    errors=$((errors + 1))
  fi

  # Docker containers
  if docker compose ps 2>/dev/null | grep -q "Up"; then
    ok "Containers Docker rodando"
  else
    warn "Containers Docker não estão rodando"
    errors=$((errors + 1))
  fi

  # Banco de dados (teste de conexão)
  if pnpm exec prisma db execute --stdin <<< "SELECT 1;" >/dev/null 2>&1; then
    ok "Banco de dados acessível"
  else
    warn "Banco de dados não está acessível"
    errors=$((errors + 1))
  fi

  # Prisma client
  if [ -d node_modules/.prisma/client ]; then
    ok "Cliente Prisma gerado"
  else
    warn "Cliente Prisma não gerado"
    errors=$((errors + 1))
  fi

  echo ""
  if [ $errors -eq 0 ]; then
    ok "Ambiente saudável ✓"
    return 0
  else
    warn "⚠ $errors problema(s) encontrado(s) — veja acima"
    return 1
  fi
}

# ═════════════════════════════════════════════════════════════════════════════
# RESUMO FINAL
# ═════════════════════════════════════════════════════════════════════════════

show_summary() {
  box
  echo -e "${GREEN}${BOLD}  BOOTSTRAP CONCLUÍDO COM SUCESSO${NC}"
  box
  echo ""
  echo "  ${BOLD}Próximos passos:${NC}"
  echo ""
  echo "  1️⃣  Inicie o dev server:"
  echo "     ${BLUE}pnpm dev${NC}  (ou: ${BLUE}make dev${NC})"
  echo ""
  echo "  2️⃣  Acesse a aplicação:"
  echo "     ${BLUE}http://localhost:3000${NC}"
  echo ""
  echo "  3️⃣  Para rodar testes:"
  echo "     ${BLUE}pnpm test${NC}  (unit)"
  echo "     ${BLUE}pnpm test:e2e${NC}  (E2E)"
  echo ""
  echo "  4️⃣  Parar serviços Docker:"
  echo "     ${BLUE}docker compose down${NC}  (ou: ${BLUE}make docker-down${NC})"
  echo ""
  echo "  5️⃣  Resetar ambiente:"
  echo "     ${BLUE}./scripts/bootstrap.sh --reset${NC}  (ou: ${BLUE}make reset${NC})"
  echo ""
  box
}

# ═════════════════════════════════════════════════════════════════════════════
# RESET (DESTRUTIVO)
# ═════════════════════════════════════════════════════════════════════════════

do_reset() {
  warn "⚠️  RESET — Isto irá:"
  warn "   • Parar e remover containers Docker"
  warn "   • Deletar volumes (banco de dados)"
  warn "   • Limpar node_modules, .next, builds"
  warn "   • Manter .env (você recria manualmente)"
  echo ""
  read -p "Tem certeza? (s/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    log "Reset cancelado"
    return 1
  fi

  log "Iniciando reset..."

  # Docker
  log "Parando e limpando Docker..."
  clean_docker 2>/dev/null || true
  ok "Docker limpo"

  # Cache
  log "Limpando cache local..."
  rm -rf node_modules .next dist build .turbo .vercel 2>/dev/null || true
  rm -rf .prisma 2>/dev/null || true
  ok "Cache limpo"

  # .env (opcional)
  warn "Deletar .env também? (s/n) "
  read -p "" -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    rm -f .env
    ok ".env deletado"
  fi

  ok "Ambiente resetado"
  echo ""
  log "Executando setup novamente..."
  do_setup
}

# ═════════════════════════════════════════════════════════════════════════════
# SETUP PRINCIPAL
# ═════════════════════════════════════════════════════════════════════════════

do_setup() {
  box
  echo -e "${GREEN}${BOLD}  BOOTSTRAP — Prato Solidário${NC}"
  box
  echo ""

  check_prereqs
  ensure_env
  install_deps
  generate_prisma
  start_docker
  run_migrations
  run_seeds
  echo ""
  check_health
  show_summary
}

# ═════════════════════════════════════════════════════════════════════════════
# ENTRYPOINT
# ═════════════════════════════════════════════════════════════════════════════

# Navegar para raiz do projeto
cd "$(dirname "${BASH_SOURCE[0]}")/.."

case "${1:-}" in
  --reset)
    do_reset
    ;;
  --health)
    check_health
    ;;
  --docker-down)
    stop_docker
    ;;
  --docker-clean)
    clean_docker
    ;;
  *)
    do_setup
    ;;
esac
