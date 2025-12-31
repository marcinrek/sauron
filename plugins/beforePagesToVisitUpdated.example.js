module.exports = {
    name: 'Before Pages To Visit Updated Example',
    version: '1.0.0',
    author: 'Your Name',
    event: 'beforePagesToVisitUpdated',
    handler: async (data) => {
        // console.log('beforePagesToVisitUpdated - Input data:', data);
        // Modify data.pagesToVisitSet (Set) as needed
        // data.pagesToVisitSet is a Set of URLs
        // Return modified data object with pagesToVisit property
        return {pagesToVisit: data.pagesToVisitSet};
    },
};
