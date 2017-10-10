const test = require('tape');
const fs = require('fs');
const path = require('path');
const database = require('../lib/database.js');
const config = require('../config.js');
var db

// Initial connection
test('Establish DB Connection', (t) => {
  t.comment('Using' + JSON.stringify(config.postgres));
  db = new database(config.postgres);
  db.getStatus()
    .then(s => {
      t.pass('Should return client on initial connection');
      t.end();
    })
    .catch(s => t.fail('Exception fail'));
});

messages =
    [
        {
            room: { provider: 'matrix', provider_id: '#test:polite.ai' },
            message: { text: 'you stink', event_id: '1234560xdeadbeef!!:L!K":LK!"":polite.ai', user: '@rob:polite.ai'}
        },
        {
            room: { provider: 'matriX', provider_id: '#test:Polite.ai' },
            message: { text: 'you may smell a bit old man', event_id: '1234860xdeadbeef!!:L!K":LK!"":polite.ai', user: '@rob:polite.ai'}
        },
        {
            room: { provider: 'slack', provider_id: '#geneta@techub.slack.com' },
            message: { text: 'you slionk', event_id: '123adfas4560xdeadbeef!!:L!K":LK!"":techub.slack.com', user: 'rob@pickering.org'}
        },
        {
            room: { provider: 'matrix', provider_id: '#test:polite.ai' },
            message: { text: 'you stink', event_id: '1234560xdeadbeef!!:L!K":LK!"":polite.ai', user: '@rob:polite.ai'}
        }
    ];


test('Build Data', (t) => {
    messages.forEach(message => {
        db.messageInsert(message.room, message.message)
        .then(row => t.ok(row.message_id, "Inserted record"))
        .catch(err => t.fail(err, 'Insert failed'));
    })
    t.end();

});
