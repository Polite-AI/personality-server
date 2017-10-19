const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();

const package = require('./package.json');
const config = require('./config.js');
const classifyMessage = require('lib/classifyMessage.js');
const getResponseForClassification = require('lib/respondToClassification.js');

const db = pgp(config.postgres);
const app = express();

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(bodyParser.json());

const apiVersion = 'v' + package.version.split('.')[0];

app.post(`/${apiVersion}/message/:language/:personality`, async function (req, res) {
  try {
    const {
      text,
      provider,
      roomId,
      eventId,
      eventTime
    } = req.body;
    const {
      language,
      personality
    } = req.params;

    var message = new Message(text, provider, roomId, eventId, userId, eventTime, {
      allData: true
    })
    const status = await message.status();
    const exists = await message.exists();

    var response = null;

    if(!status)
      throw new Error('malformed message')

    if(!exists) {
      const classification = await classifyMessage(message, language);
      message.classify('wiki-detox-1.0', classification);

      const positiveResults = Object.keys(classification)
        .filter(key => Number(classification[key]));

      if(positiveResults.length)
        response = getResponseForClassification(language, personality, classification);

    }
    res.status(200)
      .send((response) ? {
          response: response
        } :
        null);
  } catch(err) {
    console.error(err);
    res.status(500)
      .send({
        error: err.message
      });
  };

});

app.listen(8081);
