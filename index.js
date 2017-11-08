const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const package = require('./package.json');
const config = require('./config.js');

const Classify = require('./lib/classify.js')
  .Classify;
const Language = require('./lib/language.js')
  .Language;
const {
  Message,
  Room
} = require('./lib/message.js');

const app = express();

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(bodyParser.json());

const apiVersion = 'v' + package.version.split('.')[0];

app.post(`/${apiVersion}/message/:classifier/:language/:personality`, async function (req, res) {
  try {
    const {
      text,
      provider,
      roomId,
      eventId,
      userId,
      eventTime
    } = req.body;
    const {
      classifierName,
      language,
      personality
    } = req.params;

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
      throw new Error('malformed message')

    if(!exists) {
      // Got new one, classify it
      classification = await classifier.classify(text, language);
      message.classify(classifier.name, classification);
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
    const positiveResults = Object.keys(classification)
      .filter(key => Number(classification[key]));
    if(positiveResults.length) {
      lp = new Language(language, personality);
      response.response = lp.response(classification),
        response.triggered = true;
    }

    // Send results
    res.setHeader('Content-Type', 'application/json');
    console.log('response: ', response);
    res.status(200)
      .send(JSON.stringify((response) ? response : {
        status: 'OK'
      }));
  } catch(err) {
    console.error(err);
    res.status(500)
      .send(JSON.stringify({
        response: err
      }));
  };

});

app.post(`/${apiVersion}/join/:classifier/:language/:personality`, async function (req, res) {
  try {
    const {
      provider,
      roomId,
      eventId,
      userId,
      eventTime
    } = req.body;
    const {
      classifierName,
      language,
      personality
    } = req.params;

    var room = new Room(roomId, provider)
    const exists = await room.exists();

    if(!initialised) {
      response.status = 'OK';
      response.response = `Polite.ai bot here, thanks for inviting me ${userId}\n` +
        `Please can you tell me a bit more about this room, for example is it technical, social, work related etc?\n`+
        `so that I know you are talking to me, please could you preface your reply with polite: or tag me in the response\n`+
        `e.g. "polite: it is a technical group"`
    } else {
      response.status = 'seenBefore';
    }

    console.log('response: ', response);
    res.status(200)
      .send(JSON.stringify((response) ? response : {
        status: 'OK'
      }));
  } catch(err) {
    console.error(err);
    res.status(500)
      .send(JSON.stringify({
        response: err
      }));
  };

});

if(require.main === module) {
  app.listen(8081);
}

exports = module.exports = app;
