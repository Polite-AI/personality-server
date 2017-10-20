const { Message, Room } = require('../lib/message.js');
const config = require('../config.js');
const tape = require('tape')
const _test = require('tape-promise')
  .default // <---- notice 'default'
const test = _test(tape) // decorate tape
// Initial connection

const messages = require('./message-testdata.js');
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
                  t.assert(!message.shouldFail && !exists, `Load contents: Message didn't exist (${message.shouldFail} ${exists})`);
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
    // 5: Check classifications
    () => {
      return messages.reduce((p, message) => {
          return p.then(() => {
            var foo = new Message(message.message.text, message.room.provider, message.room.provider_id, message.message.event_id, message.message.user, null, {
              allData: true
            });
            return foo.status.then(status => {
                return foo.exists.then(exists => {
                    if(!exists)
                      t.fail('No message?');
                    else {
                      t.assert((message.classy == null || (foo.classification && message.classy.length == foo.classification.length)) &&
                        (message.apps == null || (foo.appeals && message.apps.length == foo.appeals.length)),
                        " Got full message with classifications and appeals expected (" +
                        ((message.classy != null) ? message.classy.length : 0) + ", " +
                        ((message.apps != null) ? message.apps.length : 0) + ") got (" +
                        ((foo.classification != null) ? foo.classification.length : 0) + ", " +
                        ((foo.appeals != null) ? foo.appeals.length : 0) + ")");
                    }
                  })
                  .catch(err => {
                    t.fail("Message didn't exist " + err.message)
                  })
              })
              .catch(err => {
                t.fail('Bad message instantiation  ' + err.message);
              });
          });

        },
        Promise.resolve(true));
    },

    // 5: Get some rooms
    () => {

      const roomCount = 2;
      //t.comment(`roomCount = ${roomCount}`);
      return Room.getList(messages[0].room.provider)
        .then(rows => {
          t.assert(rows.length == roomCount, `Got all rooms on provider ${messages[0].room.provider} (${roomCount} == ${rows.length})`);
        })
        .then(() => {
          return Room.getList(messages[0].room.provider, 'Aaardvark')
            .then(rows => {
              t.fail("Got rows for getRooms query on improbable room name");
            })
            .catch(err => {
              t.pass("Threw failure for getRooms query on improbable room name")
            })
        })
        .then(() => {
          return Room.getList(messages[0].room.provider, messages[0].room.provider_id)
            .then(rows => {
              t.assert(rows.length == 1, "Got one row for getRooms query on specific room name");
            })
            .catch(err => {
              t.fail("Should have got one row for getRooms query on specific room name")
            })
        })
    },

    // 6: Get some messages
    () => {

      // Build an array with count of rooms, and messages within those rooms.
      const providers = messages
        .reduce((p, message) => {
          if(!message.shouldFail) {
            if(!p[message.room.provider])
              p[message.room.provider] = [];
            if(!p[message.room.provider][message.room.provider_id])
              p[message.room.provider][message.room.provider_id] = 0
            p[message.room.provider][message.room.provider_id]++
          }
          return p;
        }, []);
      //t.comment(`providers: ${JSON.stringify(providers, null, 4)}`)
      //console.log('providers: ', providers);

      return Object.keys(providers).reduce((p, name) => {
          var provider = providers[name];

          //console.log('building with ', provider);
        return p.then(() => {
            //t.comment(`dealing with ${name}`);
          return Room.getList(name)
            .then(rooms => {
              //t.comment(`got ${rooms.length} for ${name}`);
              t.assert(Object.keys(provider).length == rooms.length, `Number of rooms for provider ${name} ${Object.keys(provider).length} => ${rooms.length} ${JSON.stringify(rooms, null, 4)}`);
              return rooms.reduce((r, room) => {
                    //t.comment(`building ${room.provider_id}`);
                return r.then(() => {
                  return room.getMessages({
                      limit: 9999
                    })
                    .then(m => {
                    //console.log('got message ', m, 'Provider: ', provider, 'Room: ', room);
                      t.assert(provider[room.provider_id] == m.length, `Number of messages for room ${room.provider_id}: ${provider[room.provider_id]} => ${m.length}`);
                    })
                    .catch(err => {
                        //console.log('got err ', err);

                      t.assert(provider[room.provider_id] == 0, `Number of messages for room ${room.provider_id}: 0 {provider[room.provider_id]} => 0 (${err.message})`);
                    })
                });
              }, Promise.resolve(true));
            })
        })
      }, Promise.resolve(true))

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
                  t.assert(!message.shouldFail && !exists, "Destroyed: Message didn't exist");
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
