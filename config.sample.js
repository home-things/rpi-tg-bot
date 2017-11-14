module.exports = {
  signals: {
    sources: {
      telegram: {
        token: 'XXXXXXXXX:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        chats: {
          default: NaN,
          stderr: NaN, // test, stderr, debug chat
        },
      },
    },
  },
  commands: {
    system: {
      delays: {
        answer: 8, // s
      },
    },
    list: {
      voice: {
        list: {
          say: {
            'intro_delay': 20, // s
          },
        },
      },
      home: {
        endpoints: { // wtf?
          presense: {
            'diff_delay': 30 * 60 // s
          },
        },
        data: { // wtf?
          homemates: {
            list: {
              'sasha': { presense: null, name: 'Alex', id: 147445817 },
            },
          },
        }
      }
    },
  },
};
