const fs = require('fs');
const hlp = require('./src/helpers');
const crw = require('./src/crawling');
const out = require('./src/output');

const config = hlp.readConfigJSON(process.argv[2]);
const custom = config.custom.useCustom ? require(config.custom.customFile) : null;
const urlList = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3])) : false;

let counter = {
    limit: config.maxPages,
    crawled: 0
};

let startTimestamp = hlp.getTimestamp('YYYY-MM-DD_HH-mm-ss');
let pagesToVisit = !urlList ? [config.startURL] : urlList;
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
        console.log(`${counter.crawled} of ${counter.crawled + pagesToVisit.length - 1} [${hlp.getTimestamp('HH:mm:ss')}] Crawling: ${pageURL}`);

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

            // Work on pagesToVisit only if crawled url matches patter
            if (crw.checkConfigConditions(pageURL, config.allowLinksFrom)) {

                // Add new links to list if it matches config.allowLinksFromPatter pattern
                pagesToVisit = crw.updateCrawlList(pageData.links, pagesToVisit, visitedPages, config);

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
        if (config.custom.useCustom) {
            custom.out(config, startTimestamp);
        }
        out(config, startTimestamp, outputData);
    }

};

// Init
crawl();
