const database = require('../lib/database.js').Database;
const config = require('../config.js');
var db
const tape = require('tape')
const _test = require('tape-promise')
  .default // <---- notice 'default'
const test = _test(tape) // decorate tape
// Initial connection

const { messages } = require('./message-testdata.js');

//console.log('messages: ', messages)

test('Database tests: inserting and querying', (t) => {

  t.comment('Using' + JSON.stringify(config.postgres));
  db = new database(config.postgres, Object);

  /*
   * We need to do these tests in order as we will initialise the database, populate it,
   * then query and each test phase builds on the previous one in one huge promise forest.
   *
   * Tape isn't great for doing serialised promises with clarity,
   * but it is a lot simpler in other areas so we persist.
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
          //console.log ('insert: ' , message);
        return p.then(() => {
          return db.messageInsert(message.message, message.room)
            .then(row => {
                //console.log ('insert: ' , "Insert suceeded ");
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
        .then(() => {
          return db.messageGet(null, messages[0].room)
            .then(row => t.assert(row && row.length == 10, "Got limited ("+row.length+") messages by room ID "))
            .catch(err => t.fail(err));
        })
        .then(() => {
          return db.messageGet(null, messages[0].room, {offset:11})
            .then(row => t.assert(row && row.length == 1, "Got ("+row.length+") leftover message of 11 by room ID "))
            .catch(err => t.fail(err));
        })
        .then(() => {
          return db.messageGet(null, messages[0].room, {limit:11})
            .then(row => t.assert(row && row.length == 11, "Got ("+row.length+") messages by room ID "))
            .catch(err => t.fail(err));
        })
        .then(() => {
          return db.messageGet(null, {
              id: 1
            })
            .then(row => t.fail("Should get no messages for bad room ID"))
            .catch(err => t.pass("No messages for fake room ID: " + err.message));
        });
    },

    // 5: Add classification data
    () => {
      return messages.reduce((p, message) => {
        if(message.classy != null && message.shouldFail == null)
          Object.keys(message.classy)
          .forEach(c => {
            p = p.then(() => {
                return db.messageClassify(message.message, c, message.classy[c])
              })
              .then(row => t.assert(row.class_id > 0, 'class created'))
              .catch(err => t.fail("Failed to classify: " + err.message))
          })
        return p;
      }, Promise.resolve())
    },

    // 6: Add apeal data
    () => {
      return messages.reduce((p, message) => {
            if(message.apps != null && message.shouldFail == null)
              message.apps.forEach(appeal => {
                p = p.then(() => {
                    return db.messageAppeal(message.message, appeal.type, appeal.text, appeal.user)
                  })
                  .then(row => t.assert(row.appeal_id > 0, 'appeal created'))
                  .catch(err => t.fail("Failed to appeal: " + err.message))
              });
            return p;
          },
          Promise.resolve())
        .then(() => {
          return db.messageAppeal({
            provider: 'foobar',
            event_id: 'eventything'
          }, 'foo', 'baz', 'bar')
        })
        .then(row => t.fail('bad message should have failed'))
        .catch(err => t.pass("bad message failed to appeal" + err.message))
        .then(() => {
          return db.messageAppeal(messages[0].message, 'foo')
        })
        .then(row => t.fail('bad appeal (no data) should have failed: '))
        .catch(err => t.pass("bad data failed to appeal: " + err.message))

    },

    // 7 Query for allData
    () => {
      return messages.reduce((p, message) => {

        return p.then(() => {
            return db.messageGet({
              id: message.message.id
            }, null, {
              allData: true
            })
          })
          .then(row => {
            //t.comment(JSON.stringify(row,null,4))

            t.assert((message.classy == null || (row.classification && message.classy.length == row.classification.length)) &&
              (message.apps == null || (row.appeals && message.apps.length == row.appeals.length)),
              " Got full message with classifications and appeals expected ("
              +((message.classy != null)?message.classy.length:0) + ", "
              +((message.apps != null)?message.apps.length:0) + ") got ("
              +((row.classification != null)?row.classification.length:0) + ", "
              +((row.appeals != null)?row.appeals.length:0) + ")");
          })
          .catch(err => t.fail("Classifications: "+err.message+JSON.stringify(message,null,4)));
      }, Promise.resolve())
    },

    // 8: Delete all the messages
    () => {
      return messages.reduce((p, message) => {
        return p.then(() => {
            return db.messageDestroy(message.message)
          })
          .then(row => t.assert(message.shouldFail == null, "Deleted record " + message.message.id))
          .catch(err => t.assert(message.shouldFail != null, "Failed to delete: " + err.message))

        ;
      }, Promise.resolve())
    },

    // 9: Check they are Gone
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

  // Iterate over phases and add the promise chain returned by each onto the end of one great big long
  // Uber-promise that we hand back to the test infrastructure
  return phases.reduce((p, phase) => {
      return p.then(phase)
    }, Promise.resolve(true))
    .then(t.end());

})
