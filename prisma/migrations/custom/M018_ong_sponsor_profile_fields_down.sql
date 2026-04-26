-- M018 rollback
ALTER TABLE ong_profiles DROP COLUMN IF EXISTS area_atuacao, DROP COLUMN IF EXISTS descricao;
ALTER TABLE sponsor_profiles DROP COLUMN IF EXISTS company_description;
