const colors = require('colors'); // eslint-disable-line
const fs = require('fs');
const date = require('date-and-time');

module.exports = {
    /**
     * Read config from a json file
     * @param {string} path
     * @returns {JSON} Parsed JSON
     */
    readConfigJSON: (path) => {
        let rawData = fs.readFileSync(path);
        let config = JSON.parse(rawData);
        return config;
    },

    /**
     * Get current timestamp in 'YYYY/MM/DD HH:mm:ss' format
     */
    getTimestamp: (format) => date.format(new Date(), format),

    /**
     * Convert object to array of objects
     * @param {object} obj object to convert
     * @returns {array} array of objects
     */
    objToArr: (obj) => Object.values(obj),

    /**
     * Create directory if it does not exist
     * @param {string} dirName directory path
     */
    createDirIfRequired: (dirName) => {
        if (!fs.existsSync(dirName)) {
            console.log(`Creating directory: ${dirName}`.cyan);
            fs.mkdirSync(dirName);
        }
    },
};
