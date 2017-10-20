module.exports = [{
    room: {
      provider: 'Matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'you stink',
      event_id: '1-1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
    classy: [{
      classifier: 'wikidetox',
      classification: '{"aggression": "0", "attack": "1", "toxicity": "0"}"'
  }],
    triggers: true
  },
  {
    room: {
      provider: 'Matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'something nice',
      event_id: '12345ffxdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    }
  },
  {
    room: {
      provider: 'Matrix',
      provider_id: '#development:polite.ai'
    },
    message: {
      text: 'you may smell a bit old man',
      event_id: '1234860xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
    classy: [{
        classifier: 'wikidetox',
        classification: '{"aggression": "1", "attack": "1", "toxicity": "1"}"'
      },
      {
        classifier: 'polite_ai',
        classification: '{"positivity": "1", "neutraility": "1", "bogosity": "1"}"'
      }

    ],
    apps: [{
        user: '@rob:Matrix.org',
        type: 'report',
        text: 'this user is very abusive'
      },
      {
        user: 'rob@ipcortex.co.uk',
        type: 'appeal',
        text: 'I don\'t think this is that bad TBH'
      },
      {
        user: '@rob:Matrix.org',
        type: 'appeal',
        text: 'this user is very bad \'; DROP DATABASE'
      },
      {
        user: ';ldfkalksghlwkrlsrgioj;klsgjn;oijrspgoirj;aoiergjsdf;l@rob:Matrix.org',
        type: 'appeal',
        text: 'this user is very abusive'
      },
  ],
    triggers: true
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
    classy: [{
        classifier: 'wikidetox',
        classification: '{"aggression": "0", "attack": "1", "toxicity": "1"}"'
      },
      {
        classifier: 'polite_ai',
        classification: '{"positivity": "10", "neutraility": "12", "bogosity": "14"}"'
      },
      {
        classifier: 'polite_ai',
        classification: '{"aggression": "0", "attack": "1", "toxicity": "1"}"'
      }
    ],
    apps: [{
        user: '@rob:doeirMatrix.org',
        type: 'report',
        text: 'thil/kms;lasf;s user is very abusive'
      },
      {
        user: 'rob@ipcort;lasdkex.co.uk',
        type: 'appeal',
        text: 'I don\'t think this is that bad TBH'
      },
      {
        user: '@rob:Matrix.org',
        type: 'appeal',
        text: 'this user is very ba DROP DATABASE'
      },
      {
        user: ';ldfka;sdflkas;dfasdf;laksd;flkasd;fklsdf;l@rob:Matrix.org',
        type: 'appeal',
        text: 'this user is very abusive'
      },
  ],
    triggers: true

  },
  {
    room: {
      provider: 'Matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'message 2 in first room',
      event_id: '2-1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
  },
  {
    room: {
      provider: 'Matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'message 3 in first room',
      event_id: '3-1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
  },
  {
    room: {
      provider: 'Matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'message 4 in first room',
      event_id: '4-1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
  },
  {
    room: {
      provider: 'Matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'message 5 in first room',
      event_id: '5-1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
  },
  {
    room: {
      provider: 'Matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'message 6 in first room',
      event_id: '6-1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
  },
  {
    room: {
      provider: 'Matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'message 7 in first room',
      event_id: '7-1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
  }, {
    room: {
      provider: 'Matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'message 8 in first room',
      event_id: '8-1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
  }, {
    room: {
      provider: 'Matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'message 9 in first room',
      event_id: '9-1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
  },
  {
    room: {
      provider: 'Matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'message 10 in first room',
      event_id: '10-1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'

    }
  },
  {
    room: {
      provider: 'Matrix',
      provider_id: '#test:polite.ai'
    },
    message: {
      text: 'message 11 in first room',
      event_id: '11-1234560xdeadbeef!!:L!K":LK!"":polite.ai',
      user: '@rob:polite.ai'
    },
  }

];
