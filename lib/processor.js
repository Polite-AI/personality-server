const config = require('../config.js');

const Classify = require('./lib/classify.js')
  .Classify;
const Language = require('./lib/language.js')
  .Language;
const {
  Message,
  Room
} = require('./lib/message.js');

/**
 * Room and message processor. Handles the mechanics of classifying and responding
 * to messages.
 *
 */
class Processor {
  constructor() {

  }
  /**
   * [handleMessage description]
   *
   * @method handleMessage
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
  async message(text, provider, roomId, eventId, userId, timestamp, classifierName, language, personality) {

    const classifier = new Classify(classifierName);
    var classification = null;

    var message = new Message(text, provider, roomId, eventId, userId, new Date(eventTime), {
      allData: true
    })
    const status = await message.status;
    const exists = await message.exists;
    //console.log ('body', req.body);

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
        lp = new Language(language, personality);
        response.response = eval(`\`${lp.response(classification)} ${lp.response('inviteAppeal')}\``);
        response.triggered = true;
      }
    }

    return(response) ? response : {
      status: 'OK'
    };
  }

  /**
   * Conduct a dialogue with the bot
   *
   * @method handleMessage
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
async dialogue(text, provider, roomId, eventId, userId, classifierName, language, personality){
    return {status: 'OK', `${userId} Did you mean to tell me "${text}"`?}

}

async join(provider, roomId, eventId, userId, classifierName, language, personality){

var room = new Room(roomId, provider);
const exists = await room.exists;
var response = {};

if(!exists) {
  response.status = 'OK';
  lp = new Language(language, personality);
  response.response = eval("`" + lp.response('join') + "`");
} else if(room.initialised)
  response.status = 'initialised';
else
  response.status = 'seenBefore';
return response;
}
}

module.exports = exports = {
  Processor
};
