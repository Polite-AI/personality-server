BEGIN;
  INSERT INTO schema_updates(update_number, description) VALUES(4,'Update classification type');
  ALTER TABLE classification ALTER COLUMN classification TYPE JSON using classification::json;
COMMIT;
