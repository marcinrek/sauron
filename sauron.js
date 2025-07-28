const fs = require('fs');
const chalk = require('chalk');
const hlp = require('./modules/helpers');
const crw = require('./modules/crawling');
const {out, dumpDiscarder, saveStatus, createReport} = require('./modules/output');
const {createAppData, appDateFromSaved} = require('./modules/appData');

// Load app settings
const cwd = process.cwd();
const settings = require(`${cwd}/sauron.settings.js`);

// Load crawler config
const config = hlp.readConfig(process.argv[2]);

// Load crawler custom action config
const custom = config.custom.useCustom ? require(`${cwd}/${settings.customDirectory}${config.custom.customFile}`) : null;

// Load start url list
const urlList = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3])) : false;

// Create app data object
let appData = createAppData(config, hlp.getTimestamp('YYYY-MM-DD_HH-mm-ss'), urlList, custom);

// Create output directory if it doesn't exist
hlp.createDirIfRequired(settings.outputDirectory);

// Setup crawler
const setup = async () => {
    /**
     * Handle sitemap
     */
    if (config.sitemapURL) {
        console.log(chalk.magenta(`Sitemap URL provided: ${config.sitemapURL} ... Fetching links ...`));
        let sitemapData = await crw.extractUrlsFromSitemap(config.sitemapURL);

        // Remove duplicates
        sitemapData = [...new Set(sitemapData)];
        console.log(chalk.magenta(`Found: ${sitemapData.length} links in sitemap`));

        // Validate all sitemap links and add to appData
        crw.updateCrawlList(sitemapData, appData.pagesToVisit, appData.visitedPages, appData.discardedPages, config).forEach((url) => appData.pagesToVisit.add(url));
    } else {
        console.log(chalk.magenta('No sitemap URL provided.'));
    }

    /**
     * Handle save file
     */

    // Check does save file exista and if so carry on from that point
    hlp.createDirIfRequired(settings.saveDirectory);
    hlp.createDirIfRequired(`${settings.saveDirectory}/${config.id}`);
    let saveFiles = fs.readdirSync(`${settings.saveDirectory}/${config.id}`);

    if (!saveFiles.length) {
        // Error reading save directory
        console.log(chalk.cyan('Save directory does not exist or is empty. Starting fresh ...'));
    } else {
        // Save directory exists
        let filteredFiles = saveFiles.filter((fileName) => fileName.indexOf(`${config.id}_`) === 0);

        // There is a proper save file
        if (filteredFiles.length) {
            let saveFilePath = filteredFiles[filteredFiles.length - 1];
            let savedData = JSON.parse(fs.readFileSync(`${settings.saveDirectory}/${config.id}/${saveFilePath}`));

            // Rewrite data from save file
            if (!savedData.finished) {
                // Display info about save data being loded
                console.log(chalk.green(`Reading save file: ${saveFilePath}`));

                // Write new appData from save file
                appData = appDateFromSaved(savedData);

                // Get custom data if present
                if (custom) {
                    custom.data = appData.customData;
                }
            } else {
                console.log(chalk.cyan(`Found save file: ${saveFilePath} but this crawl is finished. Starting fresh ...`));
            }
        } else {
            // There is no proper save file
            console.log(chalk.cyan('Save directory exists but save file not found. Starting fresh ...'));
        }
    }
};

// Finish crawl function
const finishCrawl = () => {
    // Create final save
    appData.finished = true;
    saveStatus(config, appData);

    // Creating output folder
    const outputDir = `${settings.outputDirectory}/${config.id}/${appData.startTimestamp}`;
    hlp.createDirIfRequired(settings.outputDirectory);
    hlp.createDirIfRequired(`${settings.outputDirectory}/${config.id}`);
    hlp.createDirIfRequired(`${settings.outputDirectory}/${config.id}/${appData.startTimestamp}`);

    // Print custom output if required
    if (config.custom.useCustom) {
        custom.out(config, appData.startTimestamp, outputDir);
    }

    // Dump discarded URL list
    if (appData.discardedPages.size) {
        dumpDiscarder(config, appData.startTimestamp, appData.discardedPages, outputDir);
    }

    // Print generic output
    if (config.storeDefaultData) {
        out(config, appData.startTimestamp, appData.outputData, outputDir);
    }

    // Crawl report
    createReport(config, appData, outputDir);
};

// Main crawl flow function
const crawl = async () => {
    // There is something to crawl AND (limit not reached OR there is no limit)
    if (appData.pagesToVisit.size && (appData.counter.limit >= appData.counter.crawled || appData.counter.limit === -1)) {
        // First request
        let pageURL = appData.pagesToVisit.values().next().value;

        // Remaining requests
        let urls = [pageURL].concat(hlp.getNextNUrls(appData.pagesToVisit, config.requestCount - 1));

        // Wait for all requests to be resolved
        Promise.all(hlp.buildCrawlPromisArray(urls, crw.singleCrawl, config, appData, custom)).then(() => {
            // Save progress if required
            if (appData.saveRequired) {
                // Change flag
                appData.saveRequired = false;

                // Add custom data to appData for save
                appData.customData = custom?.data || [];

                // Save status
                saveStatus(config, appData);
            }

            // Repeat crawl cycle
            crawl();
        });
    } else {
        finishCrawl();
    }
};

// Init function
const init = async () => {
    await setup();
    crawl();
};

// Run init function
init();
