module.exports = {
    name: 'Before URL Crawled Example',
    version: '1.0.0',
    author: 'Your Name',
    event: 'beforeURLCrawled',
    handler: async (data) => {
        // console.log('beforeURLCrawled - Input data:', data);
        // Modify data.pageURL as needed
        // Return modified data object
        return {pageURL: data.pageURL};
    },
};
