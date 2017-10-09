

BEGIN;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS classification;
DROP TABLE IF EXISTS appeals;

DROP SEQUENCE IF EXISTS message_seq;
DROP SEQUENCE IF EXISTS room_seq;
DROP SEQUENCE IF EXISTS class_seq;
DROP SEQUENCE IF EXISTS appeal_seq;

-- Messages table:
-- message_id auto assigned ID for use when we reference from other tables
-- message: full printable text of message
-- classifier: ID of engine which was used to produce derived
-- derived: JSON object representing classification we received fomr the engine
-- corrected: Subsequent correction  based on human input
-- room_key: A large key that secures this room
-- room_provider: chat system ID e.g. 'matrix', 'slack' etc
-- room_id: ID of room, unique within namespace of room provider


CREATE TABLE rooms (
    room_id BIGINT UNIQUE DEFAULT nextval('room_seq'::text),
	  provider TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    key TEXT,
	  time TIMESTAMP
);



CREATE TABLE messages (
    message_id BIGINT UNIQUE DEFAULT nextval('message_seq'::text),
	  message TEXT NOT NULL,
    provider TEXT NOT NULL,
    room_id BIGINT NOT NULL references rooms(room_id),
    user_id TEXT,
	  event_id TEXT,
	  time TIMESTAMP

);


CREATE TABLE classification (
    class_id BIGINT UNIQUE DEFAULT nextval('class_seq'::text),
    message_id BIGINT NOT NULL references messages(message_id),
    classifier TEXT,
    classification TEXT
);

CREATE TABLE appeals (
  appeal_id BIGINT UNIQUE DEFAULT nextval('appeal_seq'::text),
  message_id BIGINT NOT NULL references messages(message_id),
  type TEXT NOT NULL,
  comment TEXT NOT NULL

);

CREATE SEQUENCE message_seq start 100 increment 1 cache 20;
CREATE SEQUENCE class_seq start 100 increment 1 cache 20;
CREATE SEQUENCE appeal_seq start 100 increment 1 cache 20;
CREATE SEQUENCE room_seq start 100 increment 1 cache 20;
COMMIT;
