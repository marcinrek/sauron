/**
 * Create initial appData object
 * @param {object} config configuration data object
 * @param {string} startTimestamp start timestamp string
 * @param {array} urlList array of start urls
 * @param {object} custom custom actions object
 * @returns {object} appData object
 */
const createAppData = (config, startTimestamp, urlList, custom) => {
    return {
        finished: false,
        counter: {
            limit: config.maxPages,
            crawled: 0,
        },
        startTimestamp,
        pagesToVisit: !urlList ? new Set([config.startURL]) : new Set(urlList),
        discardedPages: new Set(),
        visitedPages: new Set(),
        outputData: {},
        customData: custom?.data || [],
    };
};

/**
 * Create appData from savedData
 * @param {object} savedData saved data JSON
 * @returns {object} appData created from savedData JSON
 */
const appDateFromSaved = (savedData) => {
    let appData = savedData;
    appData.pagesToVisit = new Set(appData.pagesToVisit);
    appData.discardedPages = new Set(appData.discardedPages);
    appData.visitedPages = new Set(appData.visitedPages);

    return appData;
};

module.exports = {
    createAppData,
    appDateFromSaved,
};
