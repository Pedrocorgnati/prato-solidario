-- M015: Adiciona campo extension_count na tabela donations
-- Permite máximo de 2 extensões de janela de doação pelo doador (TASK-2 CL-086/087)

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS extension_count INTEGER NOT NULL DEFAULT 0;

-- Índice parcial para cron de aviso de extensão: apenas doações próximas de expirar
CREATE INDEX IF NOT EXISTS IDX_donations_extension_window
  ON donations (window_end, extension_count)
  WHERE status IN ('AVAILABLE', 'RESERVED');
