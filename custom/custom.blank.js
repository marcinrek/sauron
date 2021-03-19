const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const cheerio = require('cheerio');
const URL = require('url-parse');
const hlp = require('../src/helpers');

const custom = {

    // Custom data placeholder
    // This needs to be named "data" in order to save with "saveStatusEach"
    data: [

    ],

    /**
     * Custom action to be taken with each crawled page
     * @param {object} response request response object
     * @param {boolean} errorResponse is the response from request that returned an error
     * @param {string} pageURL url of the page response comes from
     * @param {object} counter crawl counter object
     * @param {json} config configuration json
     */
    action: (response, errorResponse, pageURL, counter, config) => {
        // console.log('custom.action();');
    },

    /**
     * Custom output function
     * @param {json} config configuration json
     * @param {string} startTimestamp timestamp crawl started
     */
    out: (config, startTimestamp) => {
        // console.log('custom.out();');
    }
};

module.exports = custom;
