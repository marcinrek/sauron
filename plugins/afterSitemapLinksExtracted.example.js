module.exports = {
    name: 'After Sitemap Links Extracted Example',
    version: '1.0.0',
    author: 'Your Name',
    event: 'afterSitemapLinksExtracted',
    handler: async (data) => {
        console.log('afterSitemapLinksExtracted - Input data:', data);
        // Modify data.sitemapData (array of URLs) as needed
        // Return modified data object
        return { sitemapData: data.sitemapData };
    }
};

