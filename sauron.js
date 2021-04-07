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

// Main crawl flow function
const crawl = () => {
    // There is something to crawl AND limit not reached
    if (appData.pagesToVisit.size && appData.counter.limit !== appData.counter.crawled) {
        // First request
        let pageURL = appData.pagesToVisit.values().next().value;
        let c1 = crw.singleCrawl(pageURL, config, appData, custom);

        // Remaining requests
        let urls = hlp.getNextNUrls(appData.pagesToVisit, config.requestCount - 1);

        // All requests resolved
        Promise.all(hlp.buildCrawlPromisArray(c1, urls, crw.singleCrawl, config, appData, custom)).then(() => {
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
