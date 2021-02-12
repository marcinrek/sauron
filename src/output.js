const ObjectsToCsv = require('objects-to-csv');
const fs = require('fs');
const hlp = require('./helpers');

/**
 * Print output to console
 * @param {object} visitedPages crawl results object
 */
const consoleOutput = (visitedPages) => {
    console.log(visitedPages);
};

/**
 * Print output to disk as CSV
 * @param {object} visitedPages crawl results object
 * @param {string} startTimestamp timestamp
 * @param {object} config configuration data
 */
const csvOutput = (visitedPages, startTimestamp, config) => {
    let output = hlp.objToArr(visitedPages);

    const outputDir = './output/';
    const fileName = config.id + '_' + startTimestamp;
    const filePath = outputDir + fileName + '.csv';

    // Remove JSON syntax from CSV
    output.map((item) => {
        item.links = item.links.join('|');
        item.mailto = item.mailto.join('|');
        item.tel = item.tel.join('|');
        item.hash = item.hash.join('|');
        return item;
    });

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        console.log('Creating directory:', outputDir);
        fs.mkdirSync(outputDir);
    }

    // Write CSV to disk
    new ObjectsToCsv(output).toDisk(filePath).then(() => {
        console.log('Output file: ', filePath);
    }).catch((err) => {
        throw err;
    });

};

/**
 * Print output to disk as JSON
 * @param {object} visitedPages crawl results object
 * @param {string} startTimestamp timestamp
 * @param {object} config configuration data
 */
const jsonOutput = (visitedPages, startTimestamp, config) => {
    let output = JSON.stringify(visitedPages, null, 4);

    const outputDir = './output/';
    const fileName = config.id + '_' + startTimestamp;
    const filePath = outputDir + fileName + '.json';

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        console.log('Creating directory:', outputDir);
        fs.mkdirSync(outputDir);
    }

    // Write JSON to disk
    fs.writeFile(filePath, output, 'utf8', (err) => {
        if (err) throw err;
        console.log('Output file: ', filePath);
    });
};

/**
 * Dump dicarded pages to file
 * @param {object} config configuration data
 * @param {string} startTimestamp timestamp string used in file outputs
 * @param {array} discardedPages pages not crawled due to configuration
 */
const dumpDiscarder = (config, startTimestamp, discardedPages) => {
    let output = JSON.stringify(discardedPages, null, 4);
    const outputDir = './output/';
    const fileName = config.id + '_' + startTimestamp + '_discardedURLs';
    const filePath = outputDir + fileName + '.json';

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        console.log('Creating directory:', outputDir);
        fs.mkdirSync(outputDir);
    }

    // Write JSON to disk
    fs.writeFile(filePath, output, 'utf8', (err) => {
        if (err) throw err;
        console.log('Discarded URLs list: ', filePath);
    });
};


/**
 * Switch between output methods
 * @param {object} config method picked
 * @param {string} startTimestamp timestamp string used in file outputs
 * @param {object} visitedPages crawl results object
 */
const out = (config, startTimestamp, visitedPages) => {

    switch (config.output) {
    case 'console':
        consoleOutput(visitedPages);
        break;

    case 'csv':
        csvOutput(visitedPages, startTimestamp, config);
        break;

    case 'json':
        jsonOutput(visitedPages, startTimestamp, config);
        break;

    case 'blank':
        console.log('Blank output specified in config file ...');
        break;

    default:
        consoleOutput(visitedPages);
        break;
    }

};

module.exports = { out, dumpDiscarder };
