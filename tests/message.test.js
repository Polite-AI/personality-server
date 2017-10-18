const Message = require('../lib/message.js')
  .Message;
const config = require('../config.js');
const tape = require('tape')
const _test = require('tape-promise')
  .default // <---- notice 'default'
const test = _test(tape) // decorate tape
// Initial connection

const messages = require('./message-testdata.js')
var m = new Message();

test('Message class tests', (t) => {

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
        return m.status.then(s => {
          return m.exists.then(e => {
            t.assert(!e && !s, "Trying to create an empty message sets status, exists (false, false)");
            return true;
          })

        })
      },

      // 2 load contents
      () => {
        return messages.reduce((p, message) => {

          return p.then(() => {

            var foo = new Message(message.message.text, message.room.provider, message.room.provider_id, message.message.event_id, message.message.user);
            return foo.status.then(status => {
                return foo.exists.then(exists => {
                    t.assert(!message.shouldFail && !exists, "Load contents: Message didn't exist");
                  })
                  .catch(err => {
                    t.fail("Shouldn't happen " + err.message)
                  })
              })
              .catch(err => {
                t.fail('Message construction failed ' + err.message);
              });
          });
        }, Promise.resolve(true));
      },

      // 3 Query for existing messages
      () => {
        return messages.reduce((p, message) => {

          return p.then(() => {

            message.foo = new Message(message.message.text, message.room.provider, message.room.provider_id, message.message.event_id, message.message.user);
            return message.foo.status.then(status => {
                return message.foo.exists.then(exists => {
                    t.assert(exists, "Query existing: Message exists");
                  })
                  .catch(err => {
                    t.fail("Shouldn't happen " + err.message)
                  })
              })
              .catch(err => {
                t.fail('Message construction failed ' + err.message);
              });
          });
        }, Promise.resolve(true));
      },
      // 4: Add classification data
      () => {
        return messages.reduce((p, message) => {
          if(message.classy != null && message.shouldFail == null)
            message.classy.forEach(c => {
              p = p.then(() => {
                  return message.foo.classify(c.classifier, c.classification)
                })
                .then(row => t.assert(row.class_id > 0, 'class created'))
                .catch(err => t.fail("Failed to classify: " + err.message))
            })
          if(message.apps != null && message.shouldFail == null)
            message.apps.forEach(appeal => {
              p = p.then(() => {
                  return message.foo.appeal(appeal.type, appeal.text, appeal.user)
                })
                .then(row => t.assert(row.appeal_id > 0, 'appeal created'))
                .catch(err => t.fail("Failed to appeal: " + err.message))

            })
          return p;


      },
      Promise.resolve(true));
  },
  // 5: Delete all the messages
  () => {
    return messages.reduce((p, message) => {

      return p.then(() => {

        var foo = new Message(message.message.text, message.room.provider, message.room.provider_id, message.message.event_id, message.message.user);
        return foo.status.then(status => {
            return foo.exists.then(exists => {
                if(!exists)
                  t.fail('No message?');
                return foo.destroy()
                  .then(m => {
                    t.assert(exists, "Message destroyed");
                  })
                  .catch(err => {
                    t.fail("Destroy failed " + err.message)
                  })
              })
              .catch(err => {
                t.fail("Message didn't exist " + err.message)
              })
          })
          .catch(err => {
            t.fail('Bad message instantiation  ' + err.message);
          });
      });
    }, Promise.resolve(true));
  },

  // 6: Check they are Gone
  () => {
    return messages.reduce((p, message) => {

      return p.then(() => {

        var foo = new Message(message.message.text, message.room.provider, message.room.provider_id, message.message.event_id, message.message.user);
        return foo.status.then(status => {
            return foo.exists.then(exists => {
                t.assert(!message.shouldFail && !exists, "Message didn't exist");
              })
              .catch(err => {
                t.fail("Shouldn't happen " + err.message)
              })
          })
          .catch(err => {
            t.fail('Message construction failed ' + err.message);
          });
      });
    }, Promise.resolve(true));
  },

]

// Last phase re-creates messages whilst testing they are
// gone so repeat the deletion
phases.push(phases[phases.length - 2]);

// Iterate over phases and add the promise chain returned by each onto the end of one great big long
// Uber-promise that we hand back to the test infrastructure
return phases.reduce((p, phase) => {
    return p.then(phase)
  }, Promise.resolve(true))
  .then(t.end());

})
