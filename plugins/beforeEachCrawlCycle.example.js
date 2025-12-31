module.exports = {
    name: 'Before Each Crawl Cycle Example',
    version: '1.0.0',
    author: 'Your Name',
    event: 'beforeEachCrawlCycle',
    handler: async (data) => {
        // console.log('beforeEachCrawlCycle - Input data:', data);

        // Add 5 second delay before each crawl cycle
        console.log('Adding 5 second delay before each crawl cycle');
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Modify data.appData as needed
        // data.appData contains: finished, counter, startTimestamp, pagesToVisit (Set), discardedPages (Set), visitedPages (Set), outputData, customData, saveRequired
        // Return modified data object
        return {appData: data.appData};
    },
};
