const request = require('request-promise-native');
const config = require('../config.js');

const classifiers = {
  'wikidetox1.0': {
    uri: `https://${config.api.host}/api/${config.api.version}/classify`
  }
}

/**
 * Classification engine interface class, allows an engine to be
 * selected and handles the mechanics of calling that engine.
 *
 */
class Classify {

  /**
   * Create a classifier
   *
   * @param  {String}    classifier=default Name of classification engine to use, if not
   *   set then defaults arbitrarily to first available
   * @throws {Error} if the classifier name doesn't exist in this implementation
   */
  constructor(classifier) {
    this.name = (classifier && classifier.length && classifier != 'default') ? classifier : Object.keys(classifiers)[0];
    if(!(this.classifier = classifiers[this.name]))
      throw new Error(`No such classifier ${classifier}`);
  }
  /**
   * Send a text string to the classification server and await results
   *
   * @param  {String}  text Text to be classified
   * @param  {String}  lang=english The language that the text can be expected to be in
   * @return {Promise<Object>}     Resolves to the result object or rejects if there
   *   are communication problems with the classification server
   */
  classify(text, lang) {
    const language = (lang) ? lang : 'english';

    return request.post({
        method: 'POST',
        uri: this.classifier.uri,
        body: {
          text: text
        },
        json: true
      })
      .then(res => {
          console.log(typeof res.results, res.results);
          return res.results;
      });

  }
}

module.exports.Classify = Classify;
