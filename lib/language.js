const fs = require('fs');
const languages = {};

//Ensure system dashboards are up to date
fs.readdirSync('./languages')
  .forEach(filename => {
    const lang = filename.split('.')[0];
    languages[lang] = require('../languages/' + filename);
  });

/**
 * Generate responses in different languages, based on language packs in
 * languages/[language].json
 *
 */
class Language {

  /**
   * Initialises a language outputter based on language and personality required
   *
   * @param  {String}     language=english    Name of a valid language pack
   * @param  {String}     personality=first   Name of a valid personality, defaults to first
   * @throws {Error}      If the language pack doesn't exist in this implementation, or
   *   the personality requested doesn't exist within the language pack.
   */
  constructor(language, personality) {
    //TODO: Alter response based on classification values
    this.language = (language && language.length) ? language : 'english';
    var personalities = languages[language];
    if(!personalities) {
      throw new Error(`Failed to find language [${language}]. See documentation for valid languages.`);
    }
    this.personality = personalities[(personality && personality.length) ? personality : Object.keys(personalities)[0]];
    if(!this.personality)
      throw new Error(`Failed to find personality [${language}/${personality}]. See documentation for valid personalities.`);

  }

  /**
   * Generates a language response for a classification or dialog. Returns the first matching
   * phrase from the langauage pack which is in the set of topic objects. If the language pack
   * contains an array of possible responses for the topic then one is returned at random and if
   * there is no specific response then the default tag is used.
   *
   * @param  {*} classification  If a string then the dialog type, otherwise an object with named
   * properties that are matched to language responses if they are true.
   * @return {String}                Human output string in this language and personality
   */
  response(topic) {
    var res = null;
    if(!(topic instanceof Object))
        topic = Object.defineProperty({}, topic, {value: 1,enumerable: true});
    for(let t of Object.keys(topic))
      if(topic[t])
        if(this.personality[t] instanceof Array) {
          res = this.personality[t][Math.floor(Math.random() * this.personality[t].length)];
          break;
        }
    else if(this.personality[t] != null) {
      res = this.personality[t];
      break;
    }

    return((res != null) ? res : this.personality.default);
  }
}

module.exports.Language = Language;
