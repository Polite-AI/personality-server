BEGIN;
  INSERT INTO schema_updates(update_number, description) VALUES(3,'Update constraints to add on-delete');
  ALTER TABLE messages DROP CONSTRAINT "messages_room_id_fkey";
  ALTER TABLE classification DROP CONSTRAINT "classification_message_id_fkey";
  ALTER TABLE appeals DROP CONSTRAINT "appeals_message_id_fkey";
  ALTER TABLE messages ADD CONSTRAINT "messages_room_id_fkey" FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE;
  ALTER TABLE classification ADD CONSTRAINT "classification_message_id_fkey" FOREIGN KEY (message_id) REFERENCES messages(message_id)  ON DELETE CASCADE;
  ALTER TABLE appeals ADD CONSTRAINT "appeals_message_id_fkey" FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE;
COMMIT;
