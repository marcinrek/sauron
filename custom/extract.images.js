const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const cheerio = require('cheerio');

const settings = require('../sauron.settings.js');

const custom = {
    /**
     * Get images from response and return array of src
     * @param {object} response request response object
     * @returns {array} array of img src
     */
    getImageURL: (response) => {
        if (response.statusCode === 200) {
            let $ = cheerio.load(response.body);
            let images = [];
            $('img').each((_index, element) => {
                images.push($(element).attr('src'));
            });

            return images;
        }
        return [];
    },

    // Custom data placeholder
    data: [],

    /**
     * Custom action to be taken with each crawled page
     * @param {object} response request response object
     * @param {boolean} errorResponse is the response from request that returned an error
     * @param {string} pageURL url of the page response comes from
     * @param {object} counter crawl counter object
     * @param {json} config configuration json
     */
    action: (response, errorResponse, pageURL) => {
        const images = {
            page: pageURL,
            src: custom.getImageURL(response).join(','),
        };

        if (images.src.length) {
            custom.data.push(images);
        }
    },

    /**
     * Custom output function
     * @param {json} config configuration json
     * @param {string} startTimestamp timestamp crawl started
     * @param {string} outputPath out directory path
     */
    out: (config, startTimestamp, outputPath) => {
        const fileName = config.id + '_custom';
        const filePath = `${outputPath}/${fileName}.csv`;

        // Write CSV to disk
        new ObjectsToCsv(custom.data)
            .toDisk(filePath)
            .then(() => {
                console.log('Custom output file: ', filePath);
            })
            .catch((err) => {
                throw err;
            });
    },
};

module.exports = custom;
