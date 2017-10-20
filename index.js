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

    var message = new Message(text, provider, roomId, eventId, userId, eventTime, {
      allData: true
    })
    const status = await message.status;
    const exists = await message.exists;

    var response = null;

    if(!status)
      throw new Error('malformed message')

    if(!exists) {

      const classification = await classifier.classify(text, language);
      message.classify(classifier.name, classification);

      const positiveResults = Object.keys(classification)
        .filter(key => Number(classification[key]));

      if(positiveResults.length) {
        lp = new Language(language, personality);
        response = {
          response: lp.response(classification),
          status: 'triggered'
        }
      }

    } else
      response = {
        status: 'seenBefore'
      };
    res.setHeader('Content-Type', 'application/json');
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
