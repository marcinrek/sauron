const fs = require('fs');
const hlp = require('./src/helpers');
const crw = require('./src/crawling');
const { out, dumpDiscarder } = require('./src/output');

const config = hlp.readConfigJSON(process.argv[2]);
const custom = config.custom.useCustom ? require(config.custom.customFile) : null;
const urlList = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3])) : false;

let counter = {
    limit: config.maxPages,
    crawled: 0
};

let startTimestamp = hlp.getTimestamp('YYYY-MM-DD_HH-mm-ss');
let pagesToVisit = !urlList ? [config.startURL] : urlList;
let discardedPages = [];
let visitedPages = {};
let outputData = {};

const crawl = () => {

    // There is something to crawl AND limit not reached
    if (pagesToVisit.length && (counter.limit !== counter.crawled)) {
        let pageURL = pagesToVisit[0];
        let responsePass;
        let errorResponse = false;

        // Inc counters
        counter.crawled += 1;

        // Display info about which page is going to be crawled
        let finished = counter.crawled;
        let total = counter.crawled + pagesToVisit.length - 1;
        let percent = Math.round((finished / total) * 10000) / 100;

        console.log(`${finished} of ${total} (${percent}%) [${hlp.getTimestamp('HH:mm:ss')}] Crawling: ${pageURL}`);

        // Crawl page
        crw.visitPage(pageURL, config).then((response) => {
            responsePass = response;

        // Error response
        }).catch((response) => {
            errorResponse = true;
            responsePass = response;

        // Run crawl again on end
        }).finally(() => {

            // Build page data object
            let pageData = crw.buildPageData(responsePass, errorResponse, pageURL, counter);

            // Build custom response object
            if (config.custom.useCustom) {
                custom.action(responsePass, errorResponse, pageURL, counter, config);
            }

            // Save currently visited page data for output
            if (crw.checkConfigConditions(pageURL, config.saveCrawlData)) {
                outputData[pageURL] = pageData;
            }

            // Mark page as crawled
            visitedPages[pageURL] = true;

            // Work on pagesToVisit only if crawled url matches pattern
            if (crw.checkConfigConditions(pageURL, config.allowLinksFrom)) {

                // Add new links to list if it matches config.allowLinksFromPatter pattern
                pagesToVisit = crw.updateCrawlList(pageData.links, pagesToVisit, visitedPages, discardedPages, config);

                // Remove currently visited page from list
                pagesToVisit.splice(pagesToVisit.indexOf(pageURL), 1);

                // Strip duplicate entries
                pagesToVisit = [...new Set(pagesToVisit)];

            } else {
                // Remove currently visited page from list
                pagesToVisit.splice(pagesToVisit.indexOf(pageURL), 1);
            }

            // Crawl again
            crawl();
        });

    // Crawling done
    } else {

        // Print custom output if required
        if (config.custom.useCustom) {
            custom.out(config, startTimestamp);
        }

        // Dump discarded URL list
        if (discardedPages.length) {
            dumpDiscarder(config, startTimestamp, discardedPages);
        }

        // Print generic output
        out(config, startTimestamp, outputData);
    }

};

// Init
crawl();
