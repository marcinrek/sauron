const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const hlp = require('./helpers');

// Load app settings
const settings = JSON.parse(fs.readFileSync('./settings.json'));

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

    const outputDir = settings.outputDirectory + '/' + startTimestamp + '/';
    const fileName = `${config.id}_${startTimestamp}`;
    const filePath = `${outputDir}${fileName}.csv`;

    // Remove JSON syntax from CSV
    output.map((item) => {
        item.links = item.links.join('|');
        item.mailto = item.mailto.join('|');
        item.tel = item.tel.join('|');
        item.hash = item.hash.join('|');
        return item;
    });

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
    const outputDir = settings.outputDirectory + '/' + startTimestamp + '/';
    const fileName = `${config.id}_${startTimestamp}`;
    const filePath = `${outputDir}${fileName}.json`;

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
    const outputDir = settings.outputDirectory + '/' + startTimestamp + '/';
    const fileName = `${config.id}_${startTimestamp}_discardedURLs`;
    const filePath = `${outputDir}${fileName}.json`;

    // Write JSON to disk
    fs.writeFile(filePath, output, 'utf8', (err) => {
        if (err) throw err;
        console.log('Discarded URLs list: ', filePath);
    });
};

/**
 * Save progress to enable abort and continue
 * @param {object} config config JSON
 * @param {object} appData. object with all data to save as single JSON
 */
const saveStatus = (config, appData) => {
    let output = JSON.stringify(appData);
    const outputDir = settings.saveDirectory;
    const fileName = `${config.id}_${appData.startTimestamp}`;
    const filePath = `${outputDir}${fileName}.json`;

    // Write JSON to disk
    fs.writeFile(filePath, output, 'utf8', (err) => {
        if (err) throw err;
        console.log(`Save file: ${filePath}`.green);
    });
};

/**
 * Create crawl report
 * @param {object} config config JSON
 * @param {object} appData application data object
 */
const createReport = (config, appData) => {
    const output = {
        id: config.id,
        startTimestamp: appData.startTimestamp,
        pagesCrawled: appData.counter.crawled,
        pagesDiscarded: appData.discardedPages.length
    };
    const outputDir = settings.outputDirectory + '/' + appData.startTimestamp + '/';
    const fileName = `${config.id}_${appData.startTimestamp}_report`;
    const filePath = `${outputDir}${fileName}.json`;

    // Write JSON to disk
    fs.writeFile(filePath, JSON.stringify(output, null, 4), 'utf8', (err) => {
        if (err) throw err;
        console.log('Report: ', filePath);
    });
};

/**
 * Switch between output methods
 * @param {object} config config JSON
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

module.exports = {
    out,
    dumpDiscarder,
    saveStatus,
    createReport
};
