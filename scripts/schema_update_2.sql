BEGIN;
  INSERT INTO schema_updates(update_number, description) VALUES(2,'Add primary keys');
  ALTER TABLE rooms ADD CONSTRAINT rooms_pk PRIMARY KEY(provider, provider_id);
  ALTER TABLE messages ADD CONSTRAINT messages_pk PRIMARY KEY(provider, event_id);
COMMIT;
