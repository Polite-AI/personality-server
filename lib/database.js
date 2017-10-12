const pg = require('pg-promise')();
const ps = require('pg-promise')()
  .PreparedStatement;

/*
* Implements a SQL based store for all Polite.ai applications
* Stores rooms, messages with associated classifications and
* appeals into a SQL database with a schma which is optimised
* for bulk manipulation.
*
* All interfaces apart from constructor are async returning a Promise which resolves or rejects
*  when DB op completes.
*
* Usage:
* db = new Database(credentials)
* db.status.then(... initialisation suceeded).catch(failed)
*
* db.messageInsert(message, room) - insert new room into db
* db.messageGet([message], [room], [flags]) get message or messages from db
*   if message is non null and contains message.id or (message.event_id & message.provider)
*   then resolves to a single message is returned.
*   if message is null and room.id isn't then returns all messages in the room
*   if flags.allData then nested classifications and appeals for message(s) are also returned
* db.messageClassify(message, classifier, classification) - add a classification result
*   to this message
* db.messageAppeal(message, type, text, user) - add an appeal to this message
*
*/

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
        //console.log(error);
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
    exists.values = [room.provider, room.provider_id];
    return this.db.one(exists)
      .then(row => {
        //console.log('Room already exists', row);
        Object.assign(room, {
          id: row.room_id,
          provider: row.provider,
          provider_id: row.provider_id,
          key: row.key,
          time: row.time
        });
        return(room);
      })
      .catch(error => {
        //console.log(error, "Room doesn't exist creating room, creating it", room);
        const crypto = require('crypto');
        const roomkey = crypto.createHash('sha256', "salt")
          .update(room.provider + room.provider_id)
          .digest('base64');
        const roomInsert = new ps('room_insert', 'INSERT INTO rooms( provider, provider_id, key, time) VALUES ($1, $2, $3, $4) RETURNING room_id, provider, provider_id, key, time');
        return this.db.one(roomInsert, [room.provider, room.provider_id, roomkey, new Date()])
          .then(row => {
            //console.log("created row", row)
            Object.assign(room, {
              id: row.room_id,
              provider: row.provider,
              provider_id: row.provider_id,
              key: row.key,
              time: row.time
            });
            return(room);
          })
          .catch(error => {
            //console.log('Failed to creat room', error);
            return Promise.reject(error);
          })

      });
  }

  messageInsert(message, room) {
    return this.getRoom(room)
      .then(roomDB => {
        //console.log('roomDB', roomDB);
        const insert = new ps('message-insert', 'INSERT INTO messages(message, provider, room_id, event_id, user_id, time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING message_id');
        return this.db.one(insert, [message.text, room.provider, roomDB.id, message.event_id, message.user, new Date()])
      })
      .then(row => {
        if(row != null)
          message.id = row.message_id;
        return message;
      });
  }

  messageGet(message, room, flags) {
    //    console.log('messageGet - getting ', message, room);

    var messageSel;
    const provider = (message != null && message.provider != null) ? message.provider : ((room != null && room.provider != null) ? room.provider : null);
    const simpleSelect = "SELECT m.* FROM messages AS m ";
    const fullSelect = "     SELECT m.*,  \
                            (SELECT json_agg(a.*) as appeals FROM appeals a WHERE a.message_id = m.message_id), \
                            (SELECT json_agg(c.*) as classification FROM classification c WHERE c.message_id = m.message_id) \
                            FROM messages m ";
    const postSelect = ""; //"     GROUP BY m.message_id, m.message, m.provider, m.room_id, m.user_id, m.event_id ";

    const select = (flags && flags.allData) ? simpleSelect : fullSelect;

    //    console.log('got m', message, 'r ', room, 'p ', provider);
    if(message != null && message.id && message.id > 0)
      messageSel = new ps('message-select1', select + ' WHERE m.message_id=$1' + postSelect, [message.id]);
    else if(provider != null && message != null && message.event_id != null)
      messageSel = new ps('message-select2', select + ' WHERE m.provider=$1 AND m.event_id=$2' + postSelect, [provider, message.event_id]);
    else if(message == null && room != null && room.id)
      messageSel = new ps('message-select3', select + ' WHERE m.room_id=$1' + postSelect, [room.id]);
    else
      return Promise.reject(new Error('Not enough info to identify message'));

    return this.db.any(messageSel)
      .then(rows => {

        function makeMessage(r) {
          var ret = {
            id: r.message_id,
            text: r.message,
            provider: r.provider,
            room: r.room_id,
            user: r.user_id,
            event_id: r.event_id,
            time: r.time,
          };
          // If we don't have either of these then we want to be v. careful to avoid
          //  attaching the property to the object as no property and property.length == 0
          //  mean different things
          if(r.classification)
            ret.classification = r.classification;
          if(r.appeals)
            ret.appeals = r.appeals;
          return ret;

        }

        if(message != null && rows.length == 1) {
          Object.assign(message, makeMessage(rows[0]));
          return Promise.resolve(message);
        } else if(rows.length > 0)
          return Promise.resolve(rows.map(row => makeMessage(row)));
        else
          throw new Error('No matching rows');

      });

  }

  messageClassify(message, classifier, classification) {
    const classify = new ps('class-insert', 'INSERT INTO classification(message_id, classifier, classification, time) VALUES ((SELECT message_id from messages WHERE provider=$1 and event_id=$2), $3, $4, $5) RETURNING class_id')
    return this.db.one(classify, [message.provider, message.event_id, classifier, classification, new Date()]);
  }

  messageAppeal(message, type, text, user) {
    const appeal = new ps('appeal-insert', 'INSERT INTO appeals(message_id, type, comment, user_id, time) VALUES ((SELECT message_id from messages WHERE provider=$1 and event_id=$2), $3, $4, $5, $6) RETURNING appeal_id');
    return this.db.one(appeal, [message.provider, message.event_id, type, text, user, new Date()]);
  }

  messageDestroy(message) {
    const destroy = new ps('message-destroy', 'DELETE FROM messages WHERE provider=$1 AND event_id=$2 RETURNING message_id');
    //console.log('Destroying message', [message.provider, message.event_id]);
    return this.db.one(destroy, [message.provider, message.event_id])
      .then(row => {
        // SQL DELETE never seems to throw and error, so we ask for confirmation
        // of deleted row ID and throw if we don't get it
        if(!row || !row.message_id)
          throw new Error('Record not deleted');
        else
          return row;
      });
  }

}
