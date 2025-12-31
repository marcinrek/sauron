module.exports = {
    name: 'After Save File Read Example',
    version: '1.0.0',
    author: 'Your Name',
    event: 'afterSaveFileRead',
    handler: async (data) => {
        console.log('afterSaveFileRead - Input data:', data);
        // Modify data.savedData as needed
        // data.savedData contains: finished, counter, startTimestamp, pagesToVisit (array), discardedPages (array), visitedPages (array), outputData, customData
        // Return modified data object
        return { savedData: data.savedData };
    }
};

