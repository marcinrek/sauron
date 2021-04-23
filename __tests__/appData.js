const {createAppData, appDateFromSaved} = require('appData');
const hlp = require('helpers');

test('createAppData', () => {
    const sampleConfigPath = './configs/sample.config.json';
    const config = hlp.readConfigJSON(sampleConfigPath);
    const startTimestamp = '2021-04-23_20-32-11';

    // Test
    const urlList1 = false;
    const custom1 = {data: ['a', 'b', 'c']};
    const expectedOutput1 = {
        finished: false,
        counter: {
            limit: -1,
            crawled: 0,
        },
        startTimestamp,
        pagesToVisit: new Set([config.startURL]),
        discardedPages: new Set(),
        visitedPages: new Set(),
        outputData: {},
        customData: ['a', 'b', 'c'],
    };
    expect(createAppData(config, startTimestamp, urlList1, custom1)).toEqual(expectedOutput1);

    const urlList2 = ['http://test1', 'http://test2'];
    const custom2 = {};
    const expectedOutput2 = {
        finished: false,
        counter: {
            limit: -1,
            crawled: 0,
        },
        startTimestamp,
        pagesToVisit: new Set(urlList2),
        discardedPages: new Set(),
        visitedPages: new Set(),
        outputData: {},
        customData: [],
    };
    expect(createAppData(config, startTimestamp, urlList2, custom2)).toEqual(expectedOutput2);
});

test('appDateFromSaved', () => {
    const savedData = {
        pagesToVisit: ['http://test1', 'http://test2'],
        discardedPages: ['http://test3', 'http://test4'],
        visitedPages: ['http://test5', 'http://test6'],
    };
    const expectedOutput = {
        pagesToVisit: new Set(['http://test1', 'http://test2']),
        discardedPages: new Set(['http://test3', 'http://test4']),
        visitedPages: new Set(['http://test5', 'http://test6']),
    };

    expect(appDateFromSaved(savedData)).toEqual(expectedOutput);
});
