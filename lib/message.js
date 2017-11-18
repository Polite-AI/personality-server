const Database = require('../lib/database.js')
  .Database;
const config = require('../config.js');
const maxRows = 50;

// One database object for whole application
db = null;

class Databasey {

  constructor() {
    if(!db)
      db = new Database(config.postgresql, Message, Room);
  }
}

/**
 * Representation of a chat room which acts as a container
 * for messages. Each chat system room that we have ever seen
 * messages in has exactly one Room object
 * which is stored down to the database, and is uniquely
 * identified by its (provider, room_name) tuple.
 *
 */
class Room extends Databasey {

  /**
   * Create a Room.
   *
   * @param  {*} room If this is an
   * Object then it's properties are copied to the new Room, otherwise
   * it is regarded as a String and considered to be the unique room name
   * @param  {String} provider Entity within who's namespace this
   * room name is unique. If the logical room provider can have
   * several rooms with the same name in different scopes or
   * domains then provider will include the scope or domain to
   * ensure uniqueness of room name.
   *
   * @example development = new Room ('#developent:polite.ai', 'matrix');
   * development.exists.then(e => console.log('room',(e)?'exists':'notExist'));
   * var messages = development.getList({allData: true, limit:100});
   */
  constructor(room, provider) {

    super();

    this.values = [];

    /* Long handed carefull initialisation primarily to give
     * documentation opportunity
     */
    /**
     * Database assigned internal unique identifier
     *
     * @type {String}
     */
    this.id = (room instanceof Object) ? room.id : null;
    /**
     * Room name
     *
     * @type {String}
     */
    this.provider_id = (room instanceof Object) ? room.provider_id : room;
    /**
     * Provider namespace
     *
     * @type {String}
     */
    this.provider = (room instanceof Object) ? room.provider : provider;
    /**
     * Is this room initialised with all data (owner, type etc)
     *
     * @type {bool}
     */
    if(room instanceof Object) {
      this.values.initialised = (room instanceof Object) ? room.initialised : null;
      /**
       * Type of discussion that can nbe expected in this room:
       *  technical, social, political, business, strategy etc
       * At some point there will be a taxonomy of these things, but
       *  for now selef description by the owner
       *
       * @type {String}
       */
      this.values.type = (room instanceof Object) ? room.type : null;
      /**
       * Who seems to own this room?
       * (userId of person that invited us generally)
       *
       * @type {String}
       */
      this.values.owner = (room instanceof Object) ? room.owner : null;
      /**
       * Guaranteed unique key with at least 128 bits
       * of entropy, can be used for secure URLs
       *
       * @type {String}
       */
      this.key = (room instanceof Object) ? room.key : null;
      /**
       * Time/Date that this Room object was created
       *
       * @type {Date}
       */
      this.time = (room instanceof Object) ? room.time : null;
      /**
       * Outstanding updates complete
       *
       * @type {Promise<bool>} resolves when pending updates complete if there
       *  arent any then resolves immediately
       */
      this.updated = Promise.resolve(true);
    }

    //console.log('Room constrcutor this: ', this);

  }
  /**
   * @name Room.prototype.exists
   * @type {Promise<bool>} Resolves to true if room exists in Database
   */
  get exists() {
    var exists = true;
    if(!this.id) {
      if(this.provider_id != null && this.provider != null)
        return db.getRoom(this)
          .then(room => {
            exists = room.DBexists;
            delete room.DBexists;
            return Promise.resolve(exists);
          })
          .catch(Promise.resolve(false));
      else {
        return Promise.reject(new Error('no provider/id'));
      }
    } else
      return Promise.resolve(exists)
  }

  /**
   * Get a list of Message objects associated with a room
   *
   * @param  {Object} [flags] Search flags
   * @param {bool} flags.allData=false return deep data on Message objects - all classifications and appeals (may return lots of data)
   * @param {number} flags.offset=0 start at this ones based offset in the list (skip offset-1 entries)
   * @param {number} flags.limit=50 return limited number of records
   * @param {bool} flags.reverse=false list returned in most recent first date order
   * @return  {Promise<Message[]>}  Resolves to an array of matching message objects
   */
  getMessages(flags) {
    return db.messageGet(null, this, flags);
  }
  /**
   * Get a list of Rooms in the database
   *
   * @param  {String} provider   Name of provider
   * @param  {String} [partial_id] Restrict to rooms which have this string anywhere in their room name
   * @return {Promise<Room[]>} Resolves to an Array of Room objects or rejects if no match based on the
   * specified search criteria
   */
  static getList(provider, partial_id) {
    return db.searchRooms(provider, partial_id);
  }

  /**
   * Removes persitent database object associated
   * with this Room.
   *
   * @return {Promise} Resolves or rejects depending on
   *   whether the destroy succeeds.
   */
  destroy() {
    return db.roomDestroy(this);
  }

}

['initialised', 'type', 'owner'].forEach(prop => {
  Object.defineProperty(Room.prototype, prop, {
    set: function (val) {
      if(this.values[prop] != val) {
        this.values[prop] = val;
        //console.log(`set ${prop} = ${this.values[prop]} and calling updateroom(this, '${prop}')`)
        this.updated = db.updateRoom(this, prop)
          .catch(err => console.log(err));
      }
    },
    get: function () {
      return this.values[prop];
    }
  })
});

/**
 * Representation of a chat message in any system.
 * Messages are associated with Rooms and may have
 * Classifications and Appeals logged against them.
 *
 * @example var m = new Message("hello world", "myChat", "general", "12345", "john@example.com");
 * m.status.then(s => {
 *   if(s)
 *      console.log('message in database for id=', m.id);
 *   else
 *      console.log('message could not be created');
 *   m.exists.then(e => {
 *     console.log('message ', m.id, (e)?'already existed':'newly created');
 *   })
 * }).catch(err => console.log('create', err));
 */
class Message extends Databasey {
  /**
   * Create a Message.
   * When new, well formed Message objects are created,
   * they are asynchronously written down to a SQL
   * database. If an existing message with the same unique
   * (provider, event_id) exists in the database then these
   * are assumed to be the same message and the object is
   * populated from the database version.
   *
   * @constructor
   * @param   {*}   message   If this is an
   * Object then it's properties are copied to the new message object
   * otherwise it is the UTF8 message body as a String
   * @param  {String} provider  Unique provider ID
   * @param  {String}    room_name Name of the room that this message
   * was seen in
   * @param  {String}    event_id  Unique ID for this message - usually
   * generated by the provider and tuple (provider, event_id) should
   * be globally unique. Multiple records with same vales for this
   * tuple will be assumed to be same message even if other properties
   * differ
   * @param  {String}    user      User id associated with this message,
   * usually the author, as identified by the provider
   * @param  {Date} [time=now] creation time for this message
   * @param  {Object} [flags] Search flags
   * @param {bool} flags.allData=false return deep data on Message objects - all classifications and appeals (may return lots of data)
   *
   */
  constructor(message, provider, room_name, event_id, user, time, flags) {

    super();

    /**
     * Database assigned internal unique identifier
     *
     * @type {String}
     */
    this.id = null;
    /**
     * Message text in UTF-8
     *
     * @type {String}
     */
    this.text = null;
    /**
     * Provider identifier
     *
     * @type {String}
     */
    this.provider = null;
    /**
     * Room object this message comes from
     *
     * @type {Room}
     */
    this.room = null;
    /**
     * User identity associated with message
     *
     * @type {String}
     */
    this.user = null;
    /**
     * Unique message ID within this provider
     *
     * @type {String}
     */
    this.event_id = null;
    /**
     * Time/Date that this Message object was created
     *
     * @type {Date}
     */
    this.time = null;

    /**
     * Array of classifications that have been applied
     * to this message.
     *
     * @type {Array}
     */
    this.classification = null;
    /**
     * Array of appeals that have been lodged against
     * this message
     *
     * @type {Array}
     */
    this.appeals = null;

    Object.assign(this, (message instanceof Object) ? message : {
      text: message,
      provider: provider,
      event_id: event_id,
      user: user,
      room: new Room({
        provider: provider,
        provider_id: room_name
      }),
      time: time ? time : (new Date())
    });
    if(!this.id)
      this.status = db.messageGet(this, this.room, flags)
      .then(m => {
        /**
         * Resolves when the database status of this message
         * is known to true if the entry already existed or false
         * if it didn't exist in the database prior to this
         * instantiation.
         *
         * @type {Promise<bool>}
         */
        this.exists = Promise.resolve(true);
        /**
         * After a new Message is instantiated the database
         * is checked asynchronoulsy and the message is either
         * retrieved from the database or written to it.
         * When this completes, the exists Promise resolves
         * to true if the message was well formed and now in
         * the database. Resolves to false if there was a problem
         * with the message and it wasn't backed to the database.
         *
         * @type {Promise<bool>}
         */
        this.status = Promise.resolve(true);
        return true;
      })
      .catch(err => {
        //console.log('caught messageget');
        this.exists = Promise.resolve(false);
        this.status = db.messageInsert(this, this.room)
          .then(m => {
            this.status = Promise.resolve(true);

          })
          .catch(err => {
            //console.log('Failed to create: ', this, err)
            this.status = Promise.resolve(false);

          })

      })
    else {
      this.status = Promise.resolve(true);
      this.exists = Promise.resolve(true);
    }

  }

  /**
   * Add a classification to a message

   * @param  {String} classifier      Which classifier
   * generated this classification
   * @param  {String} classification What was the classification
   * @return {Promise<number>} Resolves when saved to database to unique
   *   database ID
   */
  classify(classifier, classification) {
    return db.messageClassify(this, classifier, classification);
  }
  /**
   * [appeal description]
   *
   * @param  {String} type 'report' unclassified
   * message<br>'appeal' existing positive classification
   * @param  {String} text free form text comment by reporter
   * @param  {String} user identifier for user reporting issue
   * @return {Promise<number>}      Resolves when appeal is
   *   stored to unique database ID of appeal
   */
  appeal(type, text, user) {
    return db.messageAppeal(this, type, text, user);
  }
  /**
   * Removes all persitent database objects associated
   * with this Message. Doesn't affect the Room record
   * that contains it, but removes all associated
   * Classification and Appeal objects
   *
   * @return {Promise} Resolves or rejects depending on
   *   whether the destroy succeeds.
   */
  destroy() {
    return db.messageDestroy(this);
  }
}

module.exports = exports = {
  Room,
  Message
};
