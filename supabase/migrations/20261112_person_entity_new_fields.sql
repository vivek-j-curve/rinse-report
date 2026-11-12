-- Person new fields
ALTER TABLE report_persons ADD COLUMN IF NOT EXISTS tax_number text;
ALTER TABLE report_persons ADD COLUMN IF NOT EXISTS social_media jsonb;
ALTER TABLE report_persons ADD COLUMN IF NOT EXISTS related_persons jsonb;
ALTER TABLE report_persons ADD COLUMN IF NOT EXISTS additional_information jsonb;

-- Remove deprecated columns (run only after confirming no data to preserve)
-- ALTER TABLE report_persons DROP COLUMN IF EXISTS mothers_name;
-- ALTER TABLE report_persons DROP COLUMN IF EXISTS employer_name;
-- ALTER TABLE report_persons DROP COLUMN IF EXISTS network_devices;
-- ALTER TABLE report_persons DROP COLUMN IF EXISTS deceased;

-- Entity new fields
ALTER TABLE report_entities ADD COLUMN IF NOT EXISTS entity_status text;
ALTER TABLE report_entities ADD COLUMN IF NOT EXISTS entity_status_date date;
ALTER TABLE report_entities ADD COLUMN IF NOT EXISTS related_entities jsonb;
