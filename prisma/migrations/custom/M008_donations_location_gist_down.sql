-- Rollback: M008 — Remove índice GiST em donations.location
DROP INDEX CONCURRENTLY IF EXISTS "IDX_donations_location_gist";
