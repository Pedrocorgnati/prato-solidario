-- M015 rollback: Remove campo extension_count e índice de extensão

DROP INDEX IF EXISTS IDX_donations_extension_window;

ALTER TABLE donations
  DROP COLUMN IF EXISTS extension_count;
