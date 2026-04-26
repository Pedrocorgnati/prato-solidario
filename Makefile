# Makefile — Prato Solidário
# Gerado por /dev-bootstrap-create (SystemForge F8)
# Uso: make [target]

.PHONY: setup reset dev test docker-down docker-clean health help

# ─────────────────────────────────────────────────────────────────────────────
# Bootstrap (Primeiros comandos)
# ─────────────────────────────────────────────────────────────────────────────

setup:
	@./scripts/bootstrap.sh

reset:
	@./scripts/bootstrap.sh --reset

# ─────────────────────────────────────────────────────────────────────────────
# Desenvolvimento
# ─────────────────────────────────────────────────────────────────────────────

dev:
	@pnpm dev

test:
	@pnpm test

test-watch:
	@pnpm test:watch

test-e2e:
	@pnpm test:e2e

test-a11y:
	@pnpm test:a11y

# ─────────────────────────────────────────────────────────────────────────────
# Docker
# ─────────────────────────────────────────────────────────────────────────────

docker-up:
	@docker compose up -d

docker-down:
	@docker compose down

docker-clean:
	@./scripts/bootstrap.sh --docker-clean

docker-logs:
	@docker compose logs -f

# ─────────────────────────────────────────────────────────────────────────────
# Banco de Dados
# ─────────────────────────────────────────────────────────────────────────────

db-seed:
	@pnpm db:seed

db-reset:
	@pnpm db:reset

db-migrate:
	@pnpm exec prisma migrate dev

db-generate:
	@pnpm exec prisma generate

# ─────────────────────────────────────────────────────────────────────────────
# Utilidades
# ─────────────────────────────────────────────────────────────────────────────

build:
	@pnpm build

lint:
	@pnpm lint

health:
	@./scripts/bootstrap.sh --health

help:
	@echo "Prato Solidário — Makefile"
	@echo ""
	@echo "Bootstrap:"
	@echo "  make setup        - Setup completo do ambiente (1ª vez)"
	@echo "  make reset        - Reset completo (para testes, cuidado!)"
	@echo ""
	@echo "Desenvolvimento:"
	@echo "  make dev          - Iniciar dev server (pnpm dev)"
	@echo "  make test         - Rodar testes unitários"
	@echo "  make test-watch   - Rodar testes em modo watch"
	@echo "  make test-e2e     - Rodar testes E2E"
	@echo "  make test-a11y    - Rodar testes de acessibilidade"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up    - Subir containers"
	@echo "  make docker-down  - Parar containers"
	@echo "  make docker-clean - Parar e remover volumes"
	@echo "  make docker-logs  - Ver logs dos containers"
	@echo ""
	@echo "Banco de Dados:"
	@echo "  make db-seed      - Executar seeds"
	@echo "  make db-reset     - Reset do banco (força)"
	@echo "  make db-migrate   - Criar nova migration"
	@echo "  make db-generate  - Gerar cliente Prisma"
	@echo ""
	@echo "Outros:"
	@echo "  make build        - Build para produção"
	@echo "  make lint         - Validar code style"
	@echo "  make health       - Health check do ambiente"
	@echo ""
