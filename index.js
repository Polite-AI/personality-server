const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const package = require('./package.json');
const config = require('./config.js');

const {
  Processor
} = require('./lib/processor.js');

process.on('unhandledRejection', r => console.log(r));

const handle = new Processor();

const app = express();

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(bodyParser.json());

const apiVersion = 'v' + package.version.split('.')[0];

process.on('unhandledRejection', r => console.log(r));

app.post(`/${apiVersion}/message/:classifier/:language/:personality`, async function (req, res) {
  try {
    const {
      text,
      provider,
      roomId,
      eventId,
      userId,
      eventTime,
      botReply
    } = req.body;
    const {
      classifier,
      language,
      personality
    } = req.params;

    var dialog = null,
      response = null;

    if(botReply != null && botReply.botDialog)
      dialog = await handle.dialogue(text, provider, roomId, eventId, userId, classifier, language, personality);

    if(botReply == null || botReply.normalMessage) {
      response = await handle.message(text, provider, roomId, eventId, userId, new Date(eventTime), classifier, language, personality);
      if(dialog) {
        response.response = (response.response != null) ? response.response : '';
        if(!dialog.smalltalk)
            response.response += '\n'+dialog.response;
        response.inDialog = dialog.inDialog;
      }
    } else {
      response = dialog
    }
    console.log('Got response: ', response, 'dialog: ', dialog, 'botReply', botReply);

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
      eventTime,
      botName
    } = req.body;
    const {
      classifier,
      language,
      personality
    } = req.params;

    var response = await handle.join(provider,
      roomId,
      eventId,
      userId,
      botName,
      classifier,
      language,
      personality)

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

    const response = await handle.destroy(provider, roomId, eventId);

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
