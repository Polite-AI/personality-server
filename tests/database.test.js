const fs = require('fs');
const path = require('path');
const database = require('../lib/database.js');
const config = require('../config.js');
var db
const tape = require('tape')
const _test = require('tape-promise')
  .default // <---- notice 'default'
const test = _test(tape) // decorate tape
// Initial connection

messages = [{
    room: {
      provider: 'matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'you stink',
      event_id: '1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
    classy: {
      wikidetox: '{ something }',
      polite_ai: '{ something_else }'
    }
  },
  {
    room: {
      provider: 'matriX',
      provider_id: '#test:Polite.ai'
    },
    message: {
      text: 'you may smell a bit old man',
      event_id: '1234860xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
    classy: {
      wikidetox: '{ something }',
      polite_ai: '{ something_else }'
  },
    appeal : [
        {user: '@rob:matrix.org', type: 'report', text: 'this user is very abusive'},
        {user: 'rob@ipcortex.co.uk', type: 'appeal', text: 'I don\'t think this is that bad TBH'},
        {user: '@rob:matrix.org', type: 'appeal', text: 'this user is very bad \'; DROP DATABASE'},
        {user: ';ldfkalksghlwkrlsrgioj;klsgjn;oijrspgoirj;aoiergjsdf;l@rob:matrix.org', type: 'appeal', text: 'this user is very abusive'},
    ]
  },
  {
    room: {
      provider: 'slack',
      provider_id: '#geneta@techub.slack.com'
    },
    message: {
      text: 'you slionk',
      event_id: '123adfas4560xdeadbeef!!:L!K":LK!"":techub.slack.com',
      user: 'rob@pickering.org'
    },
    classy: {
      wikidetox: '{ something }',
      polite_ai: '{ something_else }'
  },
  appeal : [
      {user: '@rob:doeirmatrix.org', type: 'report', text: 'thil/kms;lasf;s user is very abusive'},
      {user: 'rob@ipcort;lasdkex.co.uk', type: 'appeal', text: 'I don\'t think this is that bad TBH'},
      {user: '@rob:matrix.org', type: 'appeal', text: 'this user is very ba DROP DATABASE'},
      {user: ';ldfka;sdflkas;dfasdf;laksd;flkasd;fklsdf;l@rob:matrix.org', type: 'appeal', text: 'this user is very abusive'},
  ]

  },
  {
    room: {
      provider: 'matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'you stink',
      event_id: '1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
    shouldFail: "dup"
  }
];

test('Database tests: inserting and querying', (t) => {

  t.comment('Using' + JSON.stringify(config.postgres));
  db = new database(config.postgres);

  /*
   * We need to do these tests in order as we will initialise the database, populate it,
   * then query and each test phase builds on the previous one in one huge promise forest.
   *
   */
  phases = [
    // 1 initialise databse
    () => {
      return db.getStatus()
        .then(s => t.pass('Should return client on initial connection'))
        .catch(s => t.fail('Exception fail'))
    },

    // 2 load contents
    () => {
      return messages.reduce((p, message) => {
        return p.then(() => {
          return db.messageInsert(message.message, message.room)
            .then(row => {
              t.assert(message.shouldFail == null, "Insert suceeded ");
              return message;
            })
            .catch(err => {
              // Sometimes tests are meant to fail (attempts to insert dup keys)...
              if(message.shouldFail)
                t.pass("Insert should fail")
              else {
                // Even if it wasn't meant to fail maybe we have some old data left behind
                if(err.message.match(/duplicate key/)) {
                  t.comment('Row already inserted');
                  // Get keys so we can delete it...
                  return db.messageGet(message.message, message.room)
                    .then(m => {
                      t.comment('Got old message ');
                      return db.messageDestroy(message.message)
                        // Gone? recreate it
                        .then(() => db.messageInsert(message.message, message.room)
                          .then(row => t.pass("Inserted record " + row.id)));
                    })
                    .catch(err => t.fail(err, 'insert failed but so did messageGet of old row'));

                } else
                  t.fail('Insert failed', err);
              }
            });
        })
      }, Promise.resolve(true))
    },

    // 3 Query for existing messages
    () => {
      return messages.reduce((p, message) => {
        return p.then(() => {
            return db.messageGet(message.message, message.room)
          })
          .then(row => t.assert(row.id > 0, "Got full message "))
          .catch(err => t.fail(err));
      }, Promise.resolve())
    },

    // 4 Discrete queries
    () => {
      return db.messageGet({
          id: messages[0].message.id
        })
        .then(row => t.assert(row.id == messages[0].message.id, "Got message by message.id "))
        .catch(err => t.fail('message by message.id ' + err.message))
        .then(() => {
          return db.messageGet({
              provider: messages[1].message.provider,
              event_id: messages[1].message.event_id
            })
            .then(row => t.assert(row.id == messages[1].message.id, "Got message by provider/event_id "))
            .catch(err => t.fail(err));
        })
        .then(() => {
          return db.messageGet({
              event_id: messages[2].message.event_id
            }, {
              provider: messages[2].room.provider
            })
            .then(row => t.assert(row.id == messages[2].message.id, "Got message by room provider/message event_id"))
            .catch(err => t.fail(err));
        })
        .then(() => {
          return db.messageGet({
              event_id: messages[2].message.event_id
            })
            .then(row => t.fail("Got message but didn't supply enough info"))
            .catch(err => t.assert(err.message.match(/not enough info/i), "Failed to get message when we didn't have enough info"));
        })
    },

    // 5: Add classification data
    () => {
      return messages.reduce((p, message) => {
        if(message.classy != null)
          Object.keys(message.classy)
          .forEach(c => {
            p = p.then(() => {
                return db.messageClassify(message.message, c, message.classy[c])
              })
              .then(row => t.assert(row.class_id > 0, 'class created'))
              .catch(err => t.assert(message.classy.shouldFail != null, "Failed to classify" + err.message))
          })
        return p;
      }, Promise.resolve())
    },

    // 6: Add appeal data
    () => {
      return messages.reduce((p, message) => {
        if(message.appeal != null)
          message.appeal.forEach(appeal => {
            p = p.then(() => {
                return db.messageAppeal(message.message, appeal.type, appeal.text, appeal.user)
              })
              .then(row => t.assert(row.appeal_id > 0, 'appeal created'))
              .catch(err => t.assert(message.classy.shouldFail != null, "Failed to appeal" + err.message))
          })
        return p;
      }, Promise.resolve())
    },


    // 7: Delete all the messages
    () => {
      return messages.reduce((p, message) => {
        return p.then(() => {
            return db.messageDestroy(message.message)
          })
          .then(row => t.assert(message.shouldFail == null, "Deleted record " + message.message.id))
          .catch(err => t.assert(message.shouldFail != null, "Failed to delete" + err.message))

        ;
      }, Promise.resolve())
    },

    // 8: Check they are Gone
    () => {
      return messages.reduce((p, message) => {
        return p.then(() => {
            return db.messageGet(message.message, message.room)
          })
          .then(row => t.fail("Message should be gone " + message.message.id))
          .catch(err => t.pass("Message gone " + err.message));
      }, Promise.resolve())
    }

  ]

  return phases.reduce((p, phase) => {
    return p.then(phase)
  }, Promise.resolve(true));

})
