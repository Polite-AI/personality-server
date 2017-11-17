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
        response.response = lp.response(classification),
          response.triggered = true;
      }
    }

    // Send results
    res.setHeader('Content-Type', 'application/json');
    res.status(200)
      .send(JSON.stringify((response) ? response : {
        status: 'OK'
      }));

  } catch(err) {
    console.error(err);
    res.status(500)
      .send(JSON.stringify({
        response: err.message
      }));
  }

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

    var room = new Room(roomId, provider);
    const exists = await room.exists;
    var response = {};

    if(!exists) {
      response.status = 'OK';
      lp = new Language(language, personality);
      response.response = lp.response('join');
    } else if(room.initialised)
      response.status = 'initialised';
    else
      response.status = 'seenBefore';

    //console.log('response: ', response);
    res.setHeader('Content-Type', 'application/json');
    res.status(200)
      .send(JSON.stringify((response) ? response : {
        status: 'OK'
      }));
  } catch(err) {
    //console.error(err);
    res.status(500)
      .send(JSON.stringify({
        response: err
      }));
  };

});

app.post(`/${apiVersion}/delete`, async function (req, res) {
  try {
    const {
      provider,
      roomId,
      eventId,
    } = req.body;

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

    //console.log('response: ', response);
    res.setHeader('Content-Type', 'application/json');
    res.status(200)
      .send(JSON.stringify((response) ? response : {
        status: 'OK'
      }));
  } catch(err) {
    //console.error(err);
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
