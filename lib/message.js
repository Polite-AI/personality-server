const Database = require('../lib/database.js').Database;
const config = require('../config.js');
const maxRows = 50;

console.log('Database: ', typeof Database);

db = null;

class Room {



  constructor(room, provider, name) {
    Object.assign(this, (room instanceof Object) ? room : {
      provider: provider,
      provider_id: name
    });
  }

  get exists() {
    if(!this.id)
      return db.getRoom(this)
        .then(row => {
          return(true);
        });
    else
      return Promise.resolve(true)
  }
}

class Message {

  // Constructor new Message(), if first arg is a formatted message
  //  object then copy it's properties to this, else treat args as scalars
  constructor(message, provider, room_name, event_id, user, flags) {
    if (!db)
        db = new Database(config.postgresql, Message, Room);
    Object.assign(this, (message instanceof Object) ? message : {
      text: message,
      provider: provider,
      event_id: event_id,
      user: user,
      room: new Room({
        provider: provider,
        provider_id: room_name
      })
    });
    if(!this.id)
      this.status = db.messageGet(this, this.room, flags)
      .then(m => {
        //console.log('m: ', m)
        this.exists = Promise.resolve(true);
        this.status = Promise.resolve(true);
        return true;
      })
      .catch(err => {
        this.exists = Promise.resolve(false);
        this.status = db.messageInsert(this, this.room)
          .then(m => {
            this.status = Promise.resolve(true);
            return true;
          })
          .catch(err => {
            console.log ('Failed to create: ', this, err)
            this.status = Promise.resolve(false);
            return false;
          })
        return this.status;
      })
    else {
      this.status = Promise.resolve(true);
      this.exists = Promise.resolve(true);
    }

  }

  static getList(provider, room_name, flags) {
    return messageGet(null, {
      provider: provider,
      provider_id: room_name
    }, flags)
  }

  classify(classifier, classification) {
    return db.messageClassify(this, classifier, classification);
  }

  appeal(type, text, user) {
    return db.messageAppeal(this, type, text, user);
  }

  destroy(){
      return db.messageDestroy(this);
  }
}

exports.Message = Message;
