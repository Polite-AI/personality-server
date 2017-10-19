const config = require('./config.js');
const request = require('request-promise-native');

/**
 * Description
 * @method exports
 * @param {} text
 * @param {} language
 * @return CallExpression
 */
module.exports = async function (text, language) {
    return request.post({
        method: 'POST',
        uri: `http://${config.api.host}/api/${config.api.version}/classify`,
        body: {
            text: text
        },
        json: true
    }).then(res => res.results);
}