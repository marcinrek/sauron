module.exports = {
    name: 'After Page Data Created Example',
    version: '1.0.0',
    author: 'Your Name',
    event: 'afterPageDataCreated',
    handler: async (data) => {
        // console.log('afterPageDataCreated - Input data:', data);
        // Modify data.pageData as needed
        // data.pageData contains: id, url, title, status, links, mailto, tel, hash, error
        // Return modified data object
        return {pageData: data.pageData};
    },
};
