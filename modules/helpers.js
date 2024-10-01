const fs = require('fs');
const date = require('date-and-time');
const chalk = require('chalk');

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
        /* istanbul ignore next */
        if (!fs.existsSync(dirName)) {
            console.log(chalk.cyan(`Creating directory: ${dirName}`));
            fs.mkdirSync(dirName);
        }
    },

    /**
     * Get next N urls from pagesToVisit Set and return it as an array
     * @param {set} pagesToVisit appData.pagesToVisit Set
     * @param {number} count number of next N urls
     * @returns {array} array of next N urls
     */
    getNextNUrls: (pagesToVisit, count) => {
        let i = 0;
        let urls = [];

        for (let it = pagesToVisit.values(), val = null; (val = it.next().value); ) {
            i++;
            if (i > 1) {
                urls.push(val);
            }
            if (i > count) {
                break;
            }
        }

        return urls;
    },

    /**
     * Create array of promises with crawl requests
     * @param {promise} c1 first crawl promise
     * @param {array} urls array of urls to be called in singleCrawl
     * @param {promise} singleCrawl single crawl function that returns a promise
     * @param {object} config configuration object
     * @param {object} appData application data object
     * @param {object} custom custom action object
     * @returns {array} array of promises
     */
    buildCrawlPromisArray: (c1, urls, singleCrawl, config, appData, custom) => {
        let promiseArray = [c1];

        urls.forEach((url) => {
            promiseArray.push(singleCrawl(url, config, appData, custom));
        });

        return promiseArray;
    },
};
