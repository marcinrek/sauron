module.exports = {
    name: 'On Crawl Error Example',
    version: '1.0.0',
    author: 'Your Name',
    event: 'onCrawlError',
    handler: async (data) => {
        // console.log('onCrawlError - Input data:', data);
        // Handle error: data.responseError, data.pageURL
        // This event is informational - return value won't affect error handling
        return data;
    },
};
