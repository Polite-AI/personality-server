const pg = require('pg-promise')();
const ps = require('pg-promise')()
  .PreparedStatement;

module.exports = class Database {

  constructor(credentials) {
    this.db = pg(credentials);

    const exists = new ps('count', 'SELECT count(*) FROM messages')
    this.status = this.db.one(exists)
      .then(row => {
        if(row && row.count >= 0)
          return Promise.resolve();
        else
          return Promise.reject('No row count (even zero) on message select??');
      })
      .catch(error => {
        console.log(error);
        return Promise.reject(error);
      });

  }

  getStatus() {
    return this.status;
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
    const exists = new ps('get-room', 'SELECT room_id, provider, provider_id, key, time FROM rooms WHERE provider=$1 AND provider_id=$2 ORDER BY time DESC')
    exists.values=[room.provider, room.provider_id];
    return this.db.one(exists)
      .then(row => {
          console.log('Room already exists', row);
          return({
            id: row.room_id,
            provider: row.provider,
            provider_id: row.provider_id,
            key: row.key,
            time: row.time
          })
      })
      .catch(error => {
          console.log(error, "Room doesn't exist creatiung room, creating it", room);
          const crypto = require('crypto');
          const roomkey = crypto.createHash('sha256', "salt")
            .update(room.provider + room.provider_id)
            .digest('base64');
          const roomInsert = new ps('room_insert', 'INSERT INTO rooms( provider, provider_id, key, time) VALUES ($1, $2, $3, $4) RETURNING room_id, provider, provider_id, key, time');
          return this.db.one(roomInsert, [room.provider, room.provider_id, roomkey, new Date() ])
            .then(row => {
              console.log("created row", row)
              return ({
                id: row.room_id,
                provider: row.provider,
                provider_id: row.provider_id,
                key: row.key,
                time: row.time
              })
            })
            .catch(error => {
              console.log('Failed to creat room', error);
              return Promise.reject(error);
            })

        });
  }

  messageInsert(room, message) {
    return this.getRoom(room)
      .then(roomDB => {
          console.log('roomDB', roomDB);
        const insert = new ps('messager-insert', 'INSERT INTO messages(message, provider, room_id, event_id, user_id, time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING message_id');
        return this.db.one(insert, [message.text, room.provider, roomDB.id, message.event_id, message.user, new Date()]);
      })
      .catch(error => {
          console.log('Insert failed', error)
        return Promise.reject('invalid room');
      });

  }

  messageClassify(room, message, classifier, classification) {
    const classify = new ps('class-insert', 'INSERT INTO classification(message_id, classifier, classification, time) VALUES ((SELECT message_id from messages WHERE room_provider = "$1" and event_id = "$2"), $3, $4, $5) RETURNING class_id')
    return this.db.one(classify, [room.provider, message.event_id, classifier, classification, new Date()]);
  }

  messageAppeal(room, message, type, text, user) {
    const appeal = new ps('appeal-insert', 'INSERT INTO appeal(message_id, type, text, user_id, time) VALUES ((SELECT message_id from messages WHERE room_provider = "$1" and event_id = "$2"), $3, $4, $5, $6) RETURNING appeal_id');
    return this.db.one(appeal, [type, text, user, new Date()]);
  }

  messageGet(flags) {

  }

  destroyAll(credentials) {
    return this.db.one('DELETE FROM *');
  }

}
