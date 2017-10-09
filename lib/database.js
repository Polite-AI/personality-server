const pg = require('pg-promise');
const ps = require('pg-promise')
  .PreparedStatement;

module.exports = Class Database {

  constructor(credentials) {
    this.db = pg(credentials);

  }

  // Both of these methods deliver synchronous does it/doesn't it exist results.
  messageExists(room, event_id) {
    const exists = new ps('SELECT count(*) FROM messages WHERE room_provider = "$1" AND event_id="$2"')
    this.db.one(exists, [room.provider, event_id])
      .then(row => {
        return(row && row.count > 0);
      })
      .catch(error => {
        console.log(error);
        return false;
      });

  }

  getRoom(room) {
    const exists = new ps('SELECT room_id, provider, provider_id, key, time FROM rooms WHERE provider = "$1" AND provider_id="$2" ORDER BY time DESCENDING')
    this.db.one(exists, [room.provider, room.provider_id])
      .then(row => {
        return({
          id: row.room_id,
          provider: row.provider,
          provider_id: row.provider_id,
          key,
          row.key,
          time: row.time
        })
      })
      .catch(error => {
        const roomInsert = new ps('INSERT INTO rooms( provider, provider_id, key, time) VALUES ($1, $2, $3, $4) RETURNING room_id, provider, provider_id, key, time');
        this.db.one(roomInsert, [room.provider, room.provider_id,
            require('crypto')
            .createHash('sha256', salt)
            .update(room.provider + room.provider_id)
            .digest('base64'),
            new Date()
          ])
          .then(row => {
            return({
              id: row.room_id,
              provider: row.provider,
              provider_id: row.provider_id,
              key,
              row.key,
              time: row.time
            })
          })
          .catch(error => {
            console.log(error);
            return Promise.reject(error);
          })

      });
  }

  messageInsert(room, message) {
    return this.getRoom(room)
      .then(roomDB => {
        const insert = new ps('INSERT INTO messages(message, provider, room_id, event_id, time) VALUES ($1, $2, $3, $4, $5) RETURNING message_id');
        return this.db.one(insert, [message.text, room.provider, roomDB.id, message.event_id, new Date(eventTime)]);
      })
      .catch(error => {
        return Promise.reject('invalid room');
      });

  }

  messageClassify(room, message, classifier, classification) {
    const classify = new ps('INSERT INTO classification(message_id, classifier, classification, time) VALUES ((SELECT message_id from messages WHERE room_provider = "$1" and event_id = "$2"), $3, $4, $5) RETURNING class_id')
    return this.db.one(classify, [room.provider, message.event_id, classifier, classification, new Date(eventTime)]);
  }

  messageAppeal(room, message, type, text, user) {
    const appeal = new ps('INSERT INTO appeal(message_id, type, text, user, time) VALUES ((SELECT message_id from messages WHERE room_provider = "$1" and event_id = "$2"), $3, $4, $5, $6) RETURNING appeal_id');
    return this.db.one(appeal, [room.provider, message.event_id, type, text, user, new Date(eventTime)]);
  }

  messageGet(flags) {

  }
  destroyAll(credentials) {
    return this.db.one('DELETE FROM *');
  }

}
