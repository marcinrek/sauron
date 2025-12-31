module.exports = {
    name: 'After URL Crawled Example',
    version: '1.0.0',
    author: 'Your Name',
    event: 'afterURLCrawled',
    handler: async (data) => {
        // console.log('afterURLCrawled - Input data:', data);
        // Modify data.crawlResult as needed
        // data.crawlResult contains: statusCode, headers, body, raw
        // Return modified data object
        return {crawlResult: data.crawlResult};
    },
};
