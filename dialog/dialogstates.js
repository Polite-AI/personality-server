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
        },
        agree: {
          to: 'main',
          emit: 'agreeThanks'
        },
        smalltalk: {
          to: 'main'
        }

      }
    },
    "confirmRoomType": {
      "transitions": {
        "confirmRoomType": {
          to: 'main',
          emit: 'confirmedRoomType',
          exec: function (emit) {
            this.room.type = this.dialog.roomType;
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
          exec: function (env) {
            this.message.appeal(this.userId, 'appeal', this.dialog.challengeText);
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
          exec: function (env) {
            this.message.appeal(this.userId, 'report', this.dialog.appealText);
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
