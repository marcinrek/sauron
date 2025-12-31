module.exports = {
    name: 'Before Save Status Example',
    version: '1.0.0',
    author: 'Your Name',
    event: 'beforeSaveStatus',
    handler: async (data) => {
        console.log('beforeSaveStatus - Input data:', data);
        // Modify data.appData as needed
        // data.appData contains: finished, counter, startTimestamp, pagesToVisit (Set), discardedPages (Set), visitedPages (Set), outputData, customData, saveRequired
        // Return modified data object
        return { appData: data.appData };
    }
};

