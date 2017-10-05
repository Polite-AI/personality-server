const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();

const package = require('./package.json');
const config = require('./config.js');
const classifyMessage = require('./classifyMessage.js');
const getResponseForClassification = require('./respondToClassification.js');

const db = pgp(config.postgres);
const app = express();

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(bodyParser.json());

const apiVersion = 'v' + package.version.split('.')[0];

app.post(`/${apiVersion}/message/:language/:personality`, async function (req, res) {
    try {
        const {
            message,
            sourceId,
            roomId,
            eventId,
            eventTime
        } = req.body;
        const {
            language,
            personality
        } = req.params;

        const classification = await classifyMessage(message, language);

        const positiveResults = Object.keys(classification).filter(key => Number(classification[key]));

        if (positiveResults.length) {
            const response = getResponseForClassification(language, personality, classification);
            res.status(200).send({
                response: response
            });

            db.none('INSERT INTO messages(message, classifier, derived, room_provider, room_id, event_id, time) VALUES(${message}, ${classifier}, ${derived}, ${room_provider}, ${room_id}, ${event_id}, ${time})', {
                    message: message,
                    classifier: config.api.version,
                    derived: JSON.stringify(classification),
                    room_provider: sourceId,
                    room_id: roomId,
                    event_id: eventId,
                    time: new Date(eventTime)
                })
                .catch(err => {
                    console.error(`DB Error`, err);
                });

        } else {
            res.status(200).send(null);
        }
    } catch (err) {
        console.error(err);
        res.status(400).send({
            error: err.message
        });
    };
})
app.listen(8081);