-- M018: Add areaAtuacao + descricao to ong_profiles; companyDescription to sponsor_profiles
-- @see intake-review/TASK-13

ALTER TABLE ong_profiles
  ADD COLUMN IF NOT EXISTS area_atuacao VARCHAR(100),
  ADD COLUMN IF NOT EXISTS descricao    TEXT;

ALTER TABLE sponsor_profiles
  ADD COLUMN IF NOT EXISTS company_description TEXT;
