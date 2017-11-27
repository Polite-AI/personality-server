const snowman = {
  name: "Snowman State Transitions",
  init: "snow",
  states: {
    "snow": {
      transitions: {
        build: {
          to: 'snowman',
          emit: 'lets build a snowman'
        },
        melt: {
          to: 'water',
          emit: "oh no, it melted too quickly"
        }
      }

    },
    "snowman": {
      transitions: {
        melt: {
          to: 'water',
          emit: "help, I'm melting"
        }
      }
    },
    "water": {
      transitions: {
        evaporate: {
          to: 'clouds',
          emit: "it's very warm today"
        }
      }
    },
    "clouds": {
      transitions: {
        snowing: {
          to: 'snow',
          emit: "hey it's snowing"
        }
      }
    }
  }
}
module.exports = snowman;
