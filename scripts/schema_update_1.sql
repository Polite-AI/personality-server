BEGIN;
  INSERT INTO schema_updates(update_number, description) VALUES(1,'Add additional columns to rooms table');
  ALTER TABLE rooms ADD COLUMN type TEXT;
  ALTER TABLE rooms ADD COLUMN owner TEXT;
  ALTER TABLE rooms ADD COLUMN initialised BOOLEAN DEFAULT 'f';
COMMIT;
