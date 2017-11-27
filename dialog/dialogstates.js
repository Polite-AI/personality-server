const dialogStates = {

  name: "Polite.AI bot room dialogue states",
  init: "start",

  states: {

    "start": {
      transitions: {
        joinRoom: {
          to: 'main',
          emit: 'join'
        },
        reJoinRoom: {
          to: 'main',
          emit: 'rejoin'
        }
      }
    },

    "main": {
      transitions: {
        heardRoomType: {
          to: 'confirmRoomType',
          emit: 'confirmRoomType'
        },
        heardChallenge: {
          to: 'confirmSimpleChallenge',
          emit: 'confirmSimpleChallenge'
        },
        heardReport: {
          to: 'confirmSimpleReport',
          emit: 'confirmSimpleReport'
        }

      }
    },
    "confirmRoomType": {
      "transitions": {
        "confirmRoomType": {
          to: 'main',
          emit: 'confirmedRoomType',
          run: function (env) {
            env.room.type = env.dialog.roomType;
          }
        },
        "rejectRoomType": {
          to: 'main',
          emit: 'rejectedRoomType'
        },
      }
    },
    "confirmSimpleChallenge": {
      transitions: {
        confirmChallenge: {
          to: 'main',
          emit: 'confirmedChallenge',
          run: function (env) {
            env.message.appeal(env.userId, 'appeal', env.dialog.challengeText);
          }
        },
        rejectChallenge: {
          to: 'main',
          emit: 'rejectedChallenge'
        }
      }
    },
    "confirmSimpleReport": {
      transitions: {
        confirmReport: {
          to: 'main',
          emit: 'confirmedReport',
          run: function (env) {
            env.message.appeal(env.userId, 'report', env.dialog.appealText);
          }
        },
        rejectReport: {
          to: 'main',
          emit: 'rejectedReport'
        }
      }
    }

  }
}

module.exports = dialogStates;
