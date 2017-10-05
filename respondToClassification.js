const fs = require('fs');
const languages = {};

//Ensure system dashboards are up to date
fs.readdirSync('./languages').forEach(filename => {
    const lang = filename.split('.')[0];
    languages[lang] = require('./languages/' + filename);
});


module.exports = function (language, personality, classification) {
    //TODO: Alter response based on classification values
    const personalities = languages[language];
    if(!personalities) {
        throw new Error(`Failed to find language [${language}]. See documentation for valid languages.`);
    } else {
        const responses = personalities[personality];
        if(!responses) {
            throw new Error(`Failed to find personality [${language}/${personality}]. See documentation for valid personalities.`);
        } else {
            const randIndex = Math.floor(Math.random() * responses.length);
            return responses[randIndex];
        }
    }
}