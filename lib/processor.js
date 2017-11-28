const config = require('../config.js');
var apiai = require('apiai');

var app = apiai(config.dialogflow.key);

const Classify = require('./classify.js')
  .Classify;
const StateMachine = require('./statemachine.js')
    .StateMachine;
const Language = require('./language.js')
  .Language;
const {
  Message,
  Room
} = require('./message.js');

const DialogStates = require('../dialog/dialogstates.js')

/**
 * Room and message processor. Handles the mechanics of classifying and responding
 * to messages, including bot to person interactions.
 *
 */
class Processor {
  /**
   * Constructor
   *
   */
  constructor() {
    this.seenEvents = [];
    this.lastChallenge = [];
    this.sm = [];
  }

  // Simple state machine cache by room ID
  statemachine(id) {
    if(this.sm[id] == null)
      this.sm[id] = new StateMachine(DialogStates, this);
    return this.sm[id];
  }

  seen(id) {
    if(this.seenEvents[id] == true)
      return true;
    else
      this.seenEvents[id] = true;
    return false;
  }
  /**
   * Handle a chat room message between users, detect anything we should be detecting
   * and return a response to inject back into the room if appropriate.
   *
   * @param  {String}      text           message text
   * @param  {String}      provider
   * @param  {String}      roomId
   * @param  {String}      eventId
   * @param  {String}      userId
   * @param  {String}      timestamp
   * @param  {String}      classifierName
   * @param  {String}      language
   * @param  {String}      personality
   * @return {Promise<Object>}  Resolves to object with properties status:, triggered and response:
   */
  async message(text, provider, roomId, eventId, userId, eventTime, classifierName, language, personality) {

    // console.log('processor.message', arguments);
    const classifier = new Classify(classifierName);
    var classification = null;

    var message = new Message(text, provider, roomId, eventId, userId, new Date(eventTime), {
      allData: true
    })
    const status = await message.status;
    const exists = await message.exists;

    // Response onject, triggered is false unless we get a postive classification
    var response = {
      triggered: false
    };

    // new message always succeeds by either reading existing from DB or
    // injecting as a new one. Can only fail if data is malformed.
    if(!status)
      response.status = 'Error';

    if(!exists) {
      // Got new one, classify it
      classification = await classifier.classify(text, language);
      //console.log('1: message.eventId', message.eventId, 'classification', classification, 'response:', response)
      await message.classify(classifier.name, classification);
      response.status = 'OK';
    } else {
      // Already existed, retreive any existing classification
      if(message.classification && message.classification.length)
        Object.keys(message.classification)
        .forEach(c => {
          if(message.classification[c].classifier == classifier.name)
            classification = message.classification[c].classification;
        })
      response.status = 'seenBefore';
    }

    // If we got a positive hit on classification then add response text
    if(classification) {
      const positiveResults = Object.keys(classification)
        .filter(key => Number(classification[key]));
      if(positiveResults.length) {
        const lp = new Language(language, personality);
        response.response = eval(`\`${lp.response(classification)} ${lp.response('inviteAppeal')}\``);
        response.triggered = true;
        this.lastChallenge[roomId] = message;
      }
    }
    return(response) ? response : {
      status: 'OK'
    };
  }

  /**
   * Conduct a dialogue with the bot
   *
   * @param  {String}      text           message text
   * @param  {String}      provider
   * @param  {String}      roomId
   * @param  {String}      eventId
   * @param  {String}      userId
   * @param  {String}      timestamp
   * @param  {String}      classifierName
   * @param  {String}      language
   * @param  {String}      personality
   * @return {Promise<Object>}  Resolves to object with properties status: and response: text
   */
  async dialogue(text, provider, roomId, eventId, userId, classifierName, language, personality) {
    if(this.seen(eventId))
      return {};

    console.log('dialogue: ', arguments);
    const lp = new Language(language, personality);

    var options = {
      sessionId: roomId,
      contexts: []
    };
    console.log('lastchallenge: ', this.lastChallenge[roomId]);
    if(this.lastChallenge[roomId]) {
      options.contexts.push({
        name: 'lastchallenge',
        parameters: {
          messageText: this.lastChallenge[roomId].text,
          user: this.lastChallenge[roomId].user
        }
      });

    }
    options.contexts.push({
      name: 'main'
    });
    console.log('options', options)
    var request = app.textRequest(text, options);
    return new Promise((resolve, reject) => {
      request.on('response', response => {
        console.log(response);
        var res = {
          status: 'OK',
          smalltalk: response.result.action.match(/smalltalk/),
          inDialog: response.result.fulfillment.speech && response.result.fulfillment.speech.length,
          response: `${response.result.fulfillment.speech}`
        }
        if(response.result.action == 'set.room.type') {
          const room = new Room(roomId, provider);
          //await room.exists;
          room.type = response.result.parameters.roomtype;
          room.initialised = true;
          console.log(response, 'roomtype: ', room);
        }

        resolve(res);
      });

      request.on('error', error => {
        reject(error);
      });

      request.end();
    });

  }
  /**
   * Process a join request
   *
   * @param  {String}  provider
   * @param  {String}  roomId
   * @param  {String}  eventId
   * @param  {String}  userId
   * @param  {String}  botName
   * @param  {String}  classifierName
   * @param  {String}  language
   * @param  {String}  personality
   * @return {Promise<Object>}
   */
  async join(provider, roomId, eventId, userId, botName, classifierName, language, personality) {
    console.log('Join: ', arguments);
    if(this.seen(eventId))
      return {};

    var room = new Room(roomId, provider);
    const exists = await room.exists;
    var response = {};
    room.owner = userId;
    var sm = this.statemachine(room.id);
    console.log('sm: ', sm.state);
    if(room.dialogState != null && room.dialogState.length)
      sm.state = room.dialogState;

    const lp = new Language(language, personality);
    if(!exists) {
      response.status = 'OK';
      const lp = new Language(language, personality);
      const emit = sm.action('joinRoom');
      console.log('sm action:', sm.state, emit);
      response.response = eval("`" + lp.response(emit) + "`");
    } else if(room.initialised) {
      const emit = sm.action('reJoinRoom')
      response.response = eval("`" + lp.response(emit) + "`");
      response.status = 'initialised';
    } else {
      const emit = sm.action('reJoinRoom')
      response.response = eval("`" + lp.response(emit) + "`");
      response.status = 'seenBefore';
    }
    room.dialogState = sm.state;
    response.inDialog = true;
    return response;
  }

  async destroy(provider, roomId, eventId) {
    var thing;
    if(roomId != null)
      thing = new Room(roomId, provider);
    else if(eventId != null)
      thing = new Message({
        provider,
        event_id: eventId
      });
    else
      throw new Error('Must specify a roomId or eventId');

    if(await thing.exists) {
      await thing.destroy();
      status = 'OK';
    } else {
      await thing.destroy();
      status = 'notExist';
    }
    const response = {
      status
    };
    return response;

  }

}

module.exports = exports = {
  Processor
};
