var test = require('tape');
var request = require('supertest');

var app = require('../index.js');

const package = require('../package.json');
const config = require('../config.js');
const apiVersion = 'v' + package.version.split('.')[0];

const messages = require('./message-testdata.js');

messages.forEach(message => {
    test(`/${apiVersion}/message/english/standard`, function (assert) {
      var newMessage = {
          text:message.message.text,
          provider: message.room.provider,
          roomId: message.room.provider_id,
          eventId: message.message.event_id,
          eventTime: new Date(),
          userId: message.message.user
      }
      request(app)
        .post(`/${apiVersion}/message/english/standard`)
        .send(newMessage)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          var actualThing = res.body;
          console.log('actual ', actualThing);
          assert.error(err, 'No error');
          assert.end();
        });
    });

})

/*
test('GET /things', function (assert) {
  request(app)
    .get('/things')
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function (err, res) {
      var expectedThings = [
        { id: 1, name: 'One thing' },
        { id: 2, name: 'Another thing' }
      ];
      var actualThings = res.body;

      assert.error(err, 'No error');
      assert.same(actualThings, expectedThings, 'Retrieve list of things');
      assert.end();
    });
});

 */
