const path = require('path');
const default_credentials = require('../config.js')
  .postgres;
const pg = require('pg-promise')();
const ps = require('pg-promise')()
  .PreparedStatement;
const qf = require('pg-promise')
  .QueryFile;

const SchemaVersion = "4"

/**
 * Implements a SQL based store for all Polite.ai applications
 * Stores rooms, messages with associated classifications and
 * appeals into a SQL database with a schema which is optimised
 * for bulk manipulation.
 *
 * All interfaces apart from constructor are async returning a Promise which resolves or rejects
 *  when database operation completes.
 *
 * Database methods are not normally called from application
 * code which should use the Room and Message class abstractions.
 * The interface classes automatically push their objects out to
 * the database using the methods provided by this class.
 *
 */
class Database {

  /**
   * Create a new database worker
   *
   * @param  {Object}  credentials=from_config  Postgres database credentials
   * @param  {Message} MessageClass Class definition to be used when creating messages
   * @param  {Room}    RoomClass    Class definition to be used when creating rooms
   */
  constructor(credentials, MessageClass, RoomClass) {
    //console.log('credentials: ', credentials);
    this.db = pg((credentials) ? credentials : default_credentials);
    Database.Message = MessageClass;
    Database.Room = RoomClass;

    this.initialised.then(console.log('Database initialised'));

    const exists = new ps('count', 'SELECT count(*) FROM messages')
    this.db.one(exists)
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

  get initialised() {

    // If we haven't fired a versioncheck yet then do so
    // If/when it succeeds stash an always resolving promise
    // and return either it or the pending vesioncheck.

    if(Database.versionCheck == null)
      Database.versionCheck = this.checkVersion()
      .then(() => {
        Database.versionCheck = Promise.resolve();
      })
      .catch(err => {
        console.error('Database version problem', err);
        process.exit();
      });

    return Database.versionCheck;

  }

  async checkVersion() {

    // This is pretty expensive but whilst it is an instance methid it should only actually
    // get fired once per application invocation and result stashed on a static variable
    var runManually = [];

    // What is the highest numbered update on this schema
    const updates = await this.db.any('SELECT update_number FROM schema_updates ORDER BY update_number')
      .catch(err => console.error('Schema update: ', err));

    const db_level = (updates.length) ? updates[updates.length - 1].update_number : 0;

    // Is it good enough?
    if(db_level < SchemaVersion) {
      console.warn(`Current database is at schema level ${db_level} but code requires ${SchemaVersion}`)
      // Try to execute all missing updates
      for(var v = db_level + 1; v <= SchemaVersion; v++) {
        const file = `scripts/schema_update_${v}.sql`;
        await this.db.any(qf(path.join(__dirname + '/..', file)))
          .catch(err => {
            runManually.push(file);
            console.log(`failed to execute ${file}: ${err.message}`, 'manual: ', runManually);
            return true;
          });
      }

      //console.log('manual: ', runManually);

      if(runManually.length) {
        console.error('The following schema updates are required but did not apply cleanly (database permissions?)\n' +
          'please apply manually as the database owner\n' +
          runManually.reduce((out, file) => {
            return out + `      psql -f ${file}\n`;
          }, ''));
        throw(`Database schema level incompatible, ${runManually.length} updates must be applied`);
        return false;

      }
    }
    return true;
  }

  async getStatus() {
    await this.ready
    return this.status;
  }

  async messageExists(room, event_id) {
    const exists = new ps('SELECT count(*) FROM messages WHERE room_provider = "$1" AND event_id="$2"')
    await this.initialised;
    return this.db.one(exists, [room.provider, event_id])
      .then(row => {
        return(row && row.count > 0);
      })
      .catch(error => {
        //console.log(error);
        return false;
      });

  }

  async getRoom(room) {
    //console.log('getRoom: ', room);
    if(!room.provider || !room.provider_id)
      return Promise.reject();
    const exists = new ps('get-room', 'SELECT room_id, provider, provider_id, initialised, type, owner, key, time FROM rooms WHERE provider=$1 AND provider_id=$2 ORDER BY time DESC')
    exists.values = [room.provider, room.provider_id];
    await this.initialised;
    return this.db.one(exists)
      .then(row => {
        //console.log('Room already exists', row);
        Object.assign(room, {
          id: row.room_id,
          provider: row.provider,
          provider_id: row.provider_id,
          initialised: row.initialised,
          type: row.type,
          owner: row.owner,
          key: row.key,
          DBexists: true,
          time: row.time
        });
        return(room);
      })
      .catch(error => {
        //console.log(error, "Room doesn't exist creating room, creating it", room);
        const roomInsert = new ps('room_insert', 'INSERT INTO rooms( provider, provider_id, key, time) VALUES ($1, $2, gen_random_uuid(), $3) RETURNING room_id, provider, provider_id, key, time');
        return this.db.one(roomInsert, [room.provider, room.provider_id, new Date()])
          .then(row => {
            //console.log("created row", row)
            Object.assign(room, {
              id: row.room_id,
              provider: row.provider,
              provider_id: row.provider_id,
              initialised: row.initialised,
              type: row.type,
              owner: row.owner,
              key: row.key,
              DBexists: false,
              time: row.time
            });
            return(room);
          })
          .catch(error => {
            //console.log('Failed to create room', error);
            return Promise.reject(error);
          })

      });

  }

  async updateRoom(room, property) {
    await this.initialised;
    return await this.db.none('UPDATE rooms SET $2:raw=$3 WHERE room_id=$1', [room.id, property, room[property]])
      .catch(err => console.log(err));
  }

  async searchRooms(provider, partial_id) {
    var search = "SELECT room_id, provider, provider_id, key, time FROM rooms WHERE provider=$1 ";

    if(partial_id)
      search += "AND provider_id LIKE '%$2:value%' ";

    search += "ORDER BY time DESC";
    await this.initialised;
    return this.db.many(search, [provider, partial_id])
      .then(rows => {
        var res = [];
        rows.forEach(row => {
          res.push(new Database.Room({
            id: row.room_id,
            provider: row.provider,
            provider_id: row.provider_id,
            key: row.key,
            time: row.time
          }));
        })
        return res;
      });

  }

  async messageInsert(message, room) {
    await this.initialised;
    return this.getRoom(room)
      .then(roomDB => {
        //console.log('roomDB', roomDB);
        const insert = new ps('message-insert', 'INSERT INTO messages(message, provider, room_id, event_id, user_id, time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING message_id');
        return this.db.one(insert, [message.text, room.provider, roomDB.id, message.event_id, message.user, message.time])
      })
      .then(row => {
        if(row != null)
          message.id = row.message_id;
        return message;
      });

  }

  async messageGet(message, room, flags) {
        //console.log('messageGet - getting ', message, room);

    var messageSel;
    const provider = (message != null && message.provider != null) ? message.provider : ((room != null && room.provider != null) ? room.provider : null);
    const simpleSelect = "SELECT m.* FROM messages AS m ";
    const fullSelect = "     SELECT m.*,  \
                            (SELECT json_agg(a.*) as appeals FROM appeals a WHERE a.message_id = m.message_id), \
                            (SELECT json_agg(c.*) as classification FROM classification c WHERE c.message_id = m.message_id) \
                            FROM messages m ";
    var extraClause = " ORDER BY m.time ";

    const select = (flags && flags.allData) ? fullSelect : simpleSelect;

    if(flags && flags.reverse)
      extraClause += 'DESC';

    extraClause += " LIMIT " + ((flags && flags.limit) ? flags.limit : "10");

    if(flags && flags.offset)
      extraClause += " OFFSET " + flags.offset;

    if(message != null && message.id && message.id > 0)
      messageSel = select + ' WHERE m.message_id=${message.id}' + extraClause;
    else if(provider != null && message != null && message.event_id != null)
      messageSel = select + ' WHERE m.provider=${provider} AND m.event_id=${message.event_id}' + extraClause;
    else if(message == null && room != null && room.id)
      messageSel = select + ' WHERE m.room_id=${room.id}' + extraClause;
    else
      return Promise.reject(new Error('Not enough info to identify message'));
      //console.log('await messageget');
    await this.initialised;
    //console.log('messageget');
    return this.db.any(messageSel, {
        provider: provider,
        message: message,
        room: room
      })
      .then(rows => {
        function makeMessage(r) {
          var ret = new Database.Message({
            id: r.message_id,
            text: r.message,
            provider: r.provider,
            room: r.room_id,
            user: r.user_id,
            event_id: r.event_id,
            time: r.time,
          });
          // If we don't have either of these then we want to be v. careful to avoid
          //  attaching the property to the object as no property and property.length == 0
          //  mean different things
          if(r.classification)
            ret.classification = r.classification;
          if(r.appeals)
            ret.appeals = r.appeals;
          //console.log('classification: ', r.classification)

          return ret;

        }
        if(message != null && rows && rows.length == 1) {
          Object.assign(message, makeMessage(rows[0]));
          return Promise.resolve(message);
        } else if(rows && rows.length > 0)
          return Promise.resolve(rows.map(row => new makeMessage(row)));
        else
          throw new Error('No matching rows');

      });


  }

  async messageClassify(message, classifier, classification) {
    const classify = new ps('class-insert', 'INSERT INTO classification(message_id, classifier, classification, time) VALUES ((SELECT message_id from messages WHERE provider=$1 and event_id=$2), $3, $4, $5) RETURNING class_id')
    await this.initialised;
    return this.db.one(classify, [message.provider, message.event_id, classifier, JSON.stringify(classification), new Date()]);
  }

  async messageAppeal(message, type, text, user) {
    const appeal = new ps('appeal-insert', 'INSERT INTO appeals(message_id, type, comment, user_id, time) VALUES ((SELECT message_id from messages WHERE provider=$1 and event_id=$2), $3, $4, $5, $6) RETURNING appeal_id');
    await this.initialised;
    return this.db.one(appeal, [message.provider, message.event_id, type, text, user, new Date()]);
  }

  async messageDestroy(message) {
    const destroy = new ps('message-destroy', 'DELETE FROM messages WHERE provider=$1 AND event_id=$2 RETURNING message_id');
    //console.log('Destroying message', [message.provider, message.event_id]);
    await this.initialised;
    return this.db.one(destroy, [message.provider, message.event_id])
      .then(row => {
        if(!row || !row.message_id)
          throw new Error('Record not deleted');
        else
          return row;
      });
  }

  async roomDestroy(room) {
    await this.initialised;
    return this.db.one('DELETE FROM rooms WHERE provider=$1 AND provider_id=$2 RETURNING room_id', [room.provider, room.provider_id])
      .then(row => {
        if(!row || !row.room_id)
          throw new Error('Record not deleted');
        else
          return row;
      });
  }

}

Database.Message = null;
Database.Room = null;
Database.versionCheck = null;

exports.Database = Database;
