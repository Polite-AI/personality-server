var test = require('tape');
var request = require('supertest');

var app = require('../index.js');

const package = require('../package.json');
const config = require('../config.js');
const apiVersion = 'v' + package.version.split('.')[0];

const messages = require('./message-testdata.js');
const rooms = [{
    room: {
      provider: 'moodlE',
      roomId: '1234364484@foobar',
      eventId: '127361387@foobar5',
      userId: '@rob:foobar'
    },
    exists: false
  },
  {
    room: {
      provider: 'moodlE',
      roomId: '1234364484@foobar',
      eventId: '127361387@foobar5',
      userId: '@jim:foobar'
    },
    exists: true
  },
  {
    room: {
      provider: 'mOOdlE',
      roomId: '1234364484@foobar',
      eventId: '127361387@foobar5',
      userId: '@rob:foobar'
    },
    exists: false
  },
  {
    room: {
      provider: 'moodlE',
      roomId: '1234364484@foobar',
      eventId: '127361387@foobar5',
      userId: '@rob:foobar'
    },
    exists: true
  },
  {
    room: {
      provider: 'moodlE',
      eventId: '127361387@foobar5',
      userId: '@rob:foobar'
    },
    exists: false,
    error: true
  }

];

var deleteMe = [];

messages.forEach(message => {
  var Message = {
    provider: message.room.provider,
    eventId: message.message.event_id,
    userId: message.message.user
  }
  request(app)
    .post(`/${apiVersion}/delete`)
    .send(Message)
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function (err, res) {
      var act = res.body;
      //console.log('actual ', act, act.response);
    });

});

rooms.forEach(room => {
  if(!room.exists && !room.error && room.room.provider != null && room.room.roomId != null) {
    var postData = {
      provider: room.room.provider,
      roomId: room.room.roomId
    }
    request(app)
      .post(`/${apiVersion}/delete`)
      .send(postData)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        var act = res.body;
      });

  }

});

messages.forEach(message => {
  test(`/${apiVersion}/message/default/english/standard`, function (t) {
    var newMessage = {
      text: message.message.text,
      provider: message.room.provider,
      roomId: message.room.provider_id,
      eventId: message.message.event_id,
      eventTime: new Date(),
      userId: message.message.user
    }
    request(app)
      .post(`/${apiVersion}/message/default/english/standard`)
      .send(newMessage)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        var act = res.body;
        //console.log('actual ', act, act.response);
        t.error(err, 'No error');
        if(act.status == 'OK')
          deleteMe.push({
            provider: newMessage.provider,
            eventId: newMessage.eventId
          });
        t.assert((message.triggers && act.response && act.response.length) || (!message.triggers && !act.response), `Correct response: Message.triggers=${message.triggers} and got ${act.response}`);
        t.assert(!message.triggers == !act.triggered, `Correct response: Message.triggers=${message.triggers} and got ${JSON.stringify(act, null, 4)}`);
        t.end();
      });
  });

})

messages.forEach(message => {
  test(`/${apiVersion}/message/default/english/standard`, function (t) {
    var newMessage = {
      text: message.message.text,
      provider: message.room.provider,
      roomId: message.room.provider_id,
      eventId: message.message.event_id,
      eventTime: new Date(),
      userId: message.message.user
    }
    request(app)
      .post(`/${apiVersion}/message/default/english/standard`)
      .send(newMessage)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        var act = res.body;
        //console.log('actual ', act, act.response);
        t.error(err, 'No error');
        t.assert(act.status && act.status == 'seenBefore', `Response: ${act.status}, wanted seenBefore`);
        t.end();
      });
  });

})

rooms.forEach(room => {
  test(`/${apiVersion}/join/default/english/standard`, function (t) {
    request(app)
      .post(`/${apiVersion}/join/default/english/standard`)
      .send(room.room)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        var act = res.body;
        if(act.status == 'OK')
          deleteMe.push({
            provider: room.provider,
            roomId: room.roomId
          })
        //console.log('actual ', act, act.response);
        t.assert((room.error == true) == (err != null), `got ${(err!=null)}, wanted ${room.error == true}`);
        const want = (room.exists == true) ? 'seenBefore' : 'OK'
        if(!room.error){
          t.assert(act.status && act.status == want, `Response: ${act.status}, wanted ${want}`);
          t.assert(want != 'OK' || act.response && act.response.match(/thanks for inviting me/), `New room and wanted to see 'thanks for inviting me' in ${act.response}`);
      }
        t.end();
      });
  });

})

deleteMe.forEach(thing => {
  test(`/${apiVersion}/delete`, function (t) {
    request(app)
      .post(`/${apiVersion}/delete`)
      .send(thing)
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        var act = res.body;
        //console.log('actual ', act, act.response);
        t.error(err, 'No error');
        t.end();
      });
  });
});
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
