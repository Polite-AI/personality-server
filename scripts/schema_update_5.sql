BEGIN;
  INSERT INTO schema_updates(update_number, description) VALUES(5,'Add dialogstate to rooms table');
  ALTER TABLE rooms ADD COLUMN dialogstate JSON;
COMMIT;
