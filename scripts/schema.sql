

BEGIN;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS classification;
DROP TABLE IF EXISTS appeals;

DROP SEQUENCE IF EXISTS message_seq;
DROP SEQUENCE IF EXISTS room_seq;
DROP SEQUENCE IF EXISTS class_seq;
DROP SEQUENCE IF EXISTS appeal_seq;


-- Rooms table:
-- room_id: unique key
-- provider: unique token for the the provider of the provider_id
-- tuple of (provider, provider_id) should uniquely identify this room
-- globally
-- key is a secret which identifies this room locally
-- time: time room created

CREATE TABLE rooms (
    room_id BIGINT UNIQUE DEFAULT nextval('room_seq'::text),
	  provider TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    key TEXT,
	  time TIMESTAMP
);

-- Messages TABLE
-- message_id: uniqur key
-- message: message text in utf8
-- provider: unique token for the the provider of the event_id
-- room_id: reference to parent room_id [I think we may need something
-- more sophisticated than this as a message may be in multiple rooms in some
-- systems]
-- user_id: ID of user that generated message as asserted by provider
-- event_id: globally unique event ID within this provider tuple (provider, event_id)
--   should be temporarily unique enougbh for at least replay detection
-- time: time message received

CREATE TABLE messages (
    message_id BIGINT UNIQUE DEFAULT nextval('message_seq'::text),
	  message TEXT NOT NULL,
    provider TEXT NOT NULL,
    room_id BIGINT NOT NULL references rooms(room_id),
    user_id TEXT,
	  event_id TEXT,
	  time TIMESTAMP

);

-- Classification TABLE
-- class_id: unique key
-- message_id: reference to message
-- classifier: What classifier?
-- classification: classifier output
-- time: time classification processed

CREATE TABLE classification (
    class_id BIGINT UNIQUE DEFAULT nextval('class_seq'::text),
    message_id BIGINT NOT NULL references messages(message_id),
    classifier TEXT,
    classification TEXT,
    time TIMESTAMP
);

-- Appeals TABLE
-- appeal_id: unique key
-- message_id: reference to message
-- user_id: Who challenged
-- type: what was the challenge ('false-positive', 'false-negative')
-- comment: user comment
-- time: time classification processed

CREATE TABLE appeals (
  appeal_id BIGINT UNIQUE DEFAULT nextval('appeal_seq'::text),
  message_id BIGINT NOT NULL references messages(message_id),
  user_id TEXT,
  type TEXT NOT NULL,
  comment TEXT NOT NULL,
  time TIMESTAMP


);

CREATE SEQUENCE message_seq start 100 increment 1 cache 20;
CREATE SEQUENCE class_seq start 100 increment 1 cache 20;
CREATE SEQUENCE appeal_seq start 100 increment 1 cache 20;
CREATE SEQUENCE room_seq start 100 increment 1 cache 20;

CREATE EXTENSION pgcrypto;  
COMMIT;
