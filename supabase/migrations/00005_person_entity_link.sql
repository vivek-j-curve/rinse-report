-- Allow a person to be linked to an entity (e.g. a director of a company)
ALTER TABLE report_persons
  ADD COLUMN entity_id uuid REFERENCES report_entities(id) ON DELETE SET NULL;

CREATE INDEX idx_report_persons_entity ON report_persons(entity_id);
