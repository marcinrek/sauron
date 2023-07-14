const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const hlp = require('./helpers');
const chalk = require('chalk');

// Load app settings
const cwd = process.cwd();
const settings = require(`${cwd}/sauron.settings.js`);

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
 * @param {string} outputPath out directory path
 */
const csvOutput = (visitedPages, startTimestamp, config, outputPath) => {
    let output = hlp.objToArr(visitedPages);

    const fileName = `${config.id}`;
    const filePath = `${outputPath}/${fileName}.csv`;

    // Remove JSON syntax from CSV
    output.map((item) => {
        item.links = item.links.join('|');
        item.mailto = item.mailto.join('|');
        item.tel = item.tel.join('|');
        item.hash = item.hash.join('|');
        return item;
    });

    // Write CSV to disk
    new ObjectsToCsv(output)
        .toDisk(filePath)
        .then(() => {
            console.log('Output file: ', filePath);
        })
        .catch((err) => {
            throw err;
        });
};

/**
 * Print output to disk as JSON
 * @param {object} visitedPages crawl results object
 * @param {string} startTimestamp timestamp
 * @param {object} config configuration data
 * @param {string} outputPath out directory path
 */
const jsonOutput = (visitedPages, startTimestamp, config, outputPath) => {
    let output = JSON.stringify(visitedPages, null, 4);
    const fileName = `${config.id}`;
    const filePath = `${outputPath}/${fileName}.json`;

    // Write JSON to disk
    try {
        fs.writeFileSync(filePath, output, 'utf8');
        console.log('Output file: ', filePath);
    } catch (err) {
        if (err) throw err;
    }
};

/**
 * Dump dicarded pages to file
 * @param {object} config configuration data
 * @param {string} startTimestamp timestamp string used in file outputs
 * @param {array} discardedPages pages not crawled due to configuration
 * @param {string} outputPath out directory path
 */
const dumpDiscarder = (config, startTimestamp, discardedPages, outputPath) => {
    let output = JSON.stringify(discardedPages, null, 4);
    const fileName = `${config.id}_discardedURLs`;
    const filePath = `${outputPath}/${fileName}.json`;

    // Write JSON to disk
    try {
        fs.writeFileSync(filePath, output, 'utf8');
        console.log('Discarded URLs list: ', filePath);
    } catch (err) {
        if (err) throw err;
    }
};

/**
 * Save progress to enable abort and continue
 * @param {object} config config JSON
 * @param {object} appData. object with all data to save as single JSON
 */
const saveStatus = (config, appData) => {
    // Change Set to Array
    let output = Object.assign({}, appData);
    output.pagesToVisit = [...output.pagesToVisit];
    output.discardedPages = [...output.discardedPages];
    output.visitedPages = [...output.visitedPages];

    const outputDir = `${settings.saveDirectory}`;
    const fileName = `${config.id}_${appData.startTimestamp}`;
    const filePath = `${outputDir}/${config.id}/${fileName}.json`;

    // Write JSON to disk
    try {
        fs.writeFileSync(filePath, JSON.stringify(output), 'utf8');
        console.log(`Save file: ${chalk.cyan(filePath)}`);
    } catch (err) {
        if (err) throw err;
    }
};

/**
 * Create crawl report
 * @param {object} config config JSON
 * @param {object} appData application data object
 * @param {string} outputPath out directory path
 */
const createReport = (config, appData, outputPath) => {
    const output = {
        id: config.id,
        startTimestamp: appData.startTimestamp,
        pagesCrawled: appData.counter.crawled,
        pagesDiscarded: appData.discardedPages.length,
    };
    const fileName = `${config.id}_report`;
    const filePath = `${outputPath}/${fileName}.json`;

    // Write JSON to disk
    try {
        fs.writeFileSync(filePath, JSON.stringify(output, null, 4), 'utf8');
        console.log('Report: ', filePath);
    } catch (err) {
        if (err) throw err;
    }
};

/**
 * Switch between output methods
 * @param {object} config config JSON
 * @param {string} startTimestamp timestamp string used in file outputs
 * @param {object} visitedPages crawl results object
 * @param {string} outputPath out directory path
 */
const out = (config, startTimestamp, visitedPages, outputPath) => {
    switch (config.output) {
        case 'console':
            consoleOutput(visitedPages);
            break;

        case 'csv':
            csvOutput(visitedPages, startTimestamp, config, outputPath);
            break;

        case 'json':
            jsonOutput(visitedPages, startTimestamp, config, outputPath);
            break;

        case 'blank':
            console.log('Blank output specified in config file ...');
            break;

        default:
            consoleOutput(visitedPages);
            break;
    }
};

module.exports = {
    out,
    dumpDiscarder,
    saveStatus,
    createReport,
};
