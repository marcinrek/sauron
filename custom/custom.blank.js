// const fs = require('fs');
// const ObjectsToCsv = require('objects-to-csv');
// const cheerio = require('cheerio');
// const URL = require('url-parse');
// const hlp = require('../src/helpers');

const custom = {
    // Custom data placeholder
    // This needs to be named "data" in order to save with "saveStatusEach"
    data: [],

    /**
     * Custom action to be taken with each crawled page
     * @param {object} response request response object
     * @param {boolean} errorResponse is the response from request that returned an error
     * @param {string} pageURL url of the page response comes from
     * @param {object} counter crawl counter object
     * @param {json} config configuration json
     */
    action: (response, errorResponse, pageURL, counter, config) => {
        console.log(`custom.action(); called with response->${response}, errorResponse->${errorResponse}, pageURL->${pageURL}, counter->${counter}, config->${config}`);
    },

    /**
     * Custom output function
     * @param {json} config configuration json
     * @param {string} startTimestamp timestamp crawl started
     * @param {string} outputPath out directory path
     */
    out: (config, startTimestamp, outputPath) => {
        console.log(`custom.out(); called with config->${config}, startTimestamp->${startTimestamp}, outDirPath->${outputPath}/${startTimestamp}/`);
    },
};

module.exports = custom;
