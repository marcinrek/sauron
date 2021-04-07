const fs = require('fs');
const hlp = require('./modules/helpers');
const crw = require('./modules/crawling');
const {out, dumpDiscarder, saveStatus, createReport} = require('./modules/output');
const {createAppData, appDateFromSaved} = require('./modules/appData');

// Load app settings
const settings = JSON.parse(fs.readFileSync('./settings.json'));

// Load crawler config
const config = hlp.readConfigJSON(process.argv[2]);

// Load crawler custom action config
const custom = config.custom.useCustom ? require(config.custom.customFile) : null;

// Load start url list
const urlList = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3])) : false;

// Create app data object
let appData = createAppData(config, hlp.getTimestamp('YYYY-MM-DD_HH-mm-ss'), urlList, custom);

// Create output directory if it doesn't exist
hlp.createDirIfRequired(settings.outputDirectory);

// Check does save file exista and if so carry on from that point
hlp.createDirIfRequired(settings.saveDirectory);
let saveFiles = fs.readdirSync(settings.saveDirectory);

// Save
if (!saveFiles.length) {
    // Error reading save directory
    console.log('Save directory does not exist or is empty. Starting fresh ...'.cyan);
} else {
    // Save directory exists
    let filteredFiles = saveFiles.filter((fileName) => fileName.indexOf(`${config.id}_`) === 0);

    // There is a proper save file
    if (filteredFiles.length) {
        let saveFilePath = filteredFiles[filteredFiles.length - 1];
        let savedData = JSON.parse(fs.readFileSync(`${settings.saveDirectory}${saveFilePath}`));

        // Rewrite data from save file
        if (!savedData.finished) {
            // Display info about save data being loded
            console.log(`Reading save file: ${saveFilePath}`.green);

            // Write new appData from save file
            appData = appDateFromSaved(savedData);

            // Get custom data if present
            if (custom) {
                custom.data = appData.customData;
            }
            if (custom && config.verbose) {
                console.log('Loaded custom.data from save:'.cyan);
                console.log(custom.data);
            }
        } else {
            console.log(`Found save file: ${saveFilePath} but this crawl is finished. Starting fresh ...`.cyan);
        }
    } else {
        // There is no proper save file
        console.log('Save directory exists but save file not found. Starting fresh ...'.cyan);
    }
}

// Single page crawl
const singleCrawl = (pageURL, config) => {
    let responsePass;
    let errorResponse = false;

    return new Promise((resolve) => {
        crw.visitPage(pageURL, config)
            .then((response) => {
                responsePass = response;
            })
            .catch((response) => {
                errorResponse = true;
                responsePass = response;
            })
            .finally(() => {
                // Build page data object
                let pageData = crw.buildPageData(responsePass, errorResponse, pageURL, appData.counter);

                // Build custom response object
                if (config.custom.useCustom) {
                    custom.action(responsePass, errorResponse, pageURL, appData.counter, config);
                }

                // Save currently visited page data for output
                if (crw.checkConfigConditions(pageURL, config.saveCrawlData) && config.storeDefaultData) {
                    appData.outputData[pageURL] = pageData;
                }

                // Mark page as crawled
                appData.visitedPages.add(pageURL);

                // Work on pagesToVisit only if crawled url matches pattern
                if (crw.checkConfigConditions(pageURL, config.allowLinksFrom)) {
                    // Add new links to list if it matches config.allowLinksFromPatter pattern
                    crw.updateCrawlList(pageData.links, appData.pagesToVisit, appData.visitedPages, appData.discardedPages, config).forEach((url) => appData.pagesToVisit.add(url));
                }

                // Remove currently visited page from list
                appData.pagesToVisit.delete(pageURL);

                // Inc counters
                appData.counter.crawled += 1;

                // // Display info about which page is going to be crawled
                let finished = appData.counter.crawled;
                let total = appData.counter.crawled + appData.pagesToVisit.size - 1;
                let percent = Math.round((finished / total) * 10000) / 100;
                console.log(`${finished} of ${total} (${percent}%) [${hlp.getTimestamp('HH:mm:ss')}] Crawling: ${pageURL}`);

                // Mark that save is required
                if (!(appData.counter.crawled % config.saveStatusEach) && config.saveStatusEach !== -1) {
                    appData.saveRequired = true;
                }

                // Resolve this crawl
                resolve();
            });
    });
};

// Main crawl flow function
const crawl = () => {
    // There is something to crawl AND limit not reached
    if (appData.pagesToVisit.size && appData.counter.limit !== appData.counter.crawled) {
        // First request
        let pageURL = appData.pagesToVisit.values().next().value;
        let c1 = singleCrawl(pageURL, config);

        // Remaining requests
        let urls = hlp.getNextNUrls(appData.pagesToVisit, config.requestCount - 1);

        // All requests resolved
        Promise.all(hlp.buildCrawlPromisArray(c1, urls, singleCrawl, config)).then(() => {
            // Save progress if required
            if (appData.saveRequired) {
                // Add custom data to appData for save
                appData.customData = custom.data;

                // Save status
                saveStatus(config, appData);

                // Change flag
                appData.saveRequired = false;
            }

            // Repeat crawl cycle
            crawl();
        });
    } else {
        // Create final save
        appData.finished = true;
        saveStatus(config, appData);

        // Creating output folder
        hlp.createDirIfRequired(settings.outputDirectory + '/' + appData.startTimestamp);

        // Print custom output if required
        if (config.custom.useCustom) {
            custom.out(config, appData.startTimestamp);
        }

        // Dump discarded URL list
        if (appData.discardedPages.size) {
            dumpDiscarder(config, appData.startTimestamp, appData.discardedPages);
        }

        // Print generic output
        if (config.storeDefaultData) {
            out(config, appData.startTimestamp, appData.outputData);
        }

        // Crawl report
        createReport(config, appData);
    }
};

// Init
crawl();
