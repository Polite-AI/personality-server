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
    this.language = (language && language.length)?language:'english';
    var personalities = languages[language];
    if(!personalities) {
      throw new Error(`Failed to find language [${language}]. See documentation for valid languages.`);
    }
    this.personality = personalities[(personality && personality.length) ? personality : Object.keys(personalities)[0]];
      if(!this.personality)
        throw new Error(`Failed to find personality [${language}/${personality}]. See documentation for valid personalities.`);

  }

/**
 * Generates a language response for a classification
 *
 * @param  {String} classification The classification results (currently ignored)
 * @return {String}                Human output string in this language and personality
 */
 response(classification) {

    //TODO: Alter response set based on classification values
    const responses = this.personality;
    const randIndex = Math.floor(Math.random() * responses.length);
    return responses[randIndex];
  }
}

module.exports.Language = Language;
