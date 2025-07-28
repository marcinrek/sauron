const hlp = require('helpers');

test('readConfig', () => {
    // Test with JavaScript config file
    const jsPath = './configs/sample.config.js';
    const jsConfig = hlp.readConfig(jsPath);

    expect(jsConfig).toBeInstanceOf(Object);
    expect(jsConfig.id).toBeDefined();
    expect(jsConfig.startURL).toBeDefined();

    // Test with JSON config file (if it exists)
    const fs = require('fs');
    const jsonPath = './configs/sample.config.json';

    if (fs.existsSync(jsonPath)) {
        const jsonConfig = hlp.readConfig(jsonPath);
        expect(jsonConfig).toBeInstanceOf(Object);
    }
});

test('getTimestamp', () => {
    // Overwrite Date
    const _Date = Date;
    let dateOBJ = new Date(2021, 3, 8, 16, 24, 30);
    Date = undefined;
    Date = function () {
        return dateOBJ;
    };

    expect(hlp.getTimestamp('YYYY-MM-DD_HH-mm-ss')).toBe('2021-04-08_16-24-30');
    expect(hlp.getTimestamp('YYYY-MM-DD_HH-mm')).toBe('2021-04-08_16-24');
    expect(hlp.getTimestamp('YYYY-MM-DD_HH')).toBe('2021-04-08_16');
    expect(hlp.getTimestamp('YYYY-MM-DD')).toBe('2021-04-08');

    // Revert Date
    Date = _Date;
});

test('objToArr', () => {
    const input = {
        a: 1,
        b: 2,
        c: 3,
    };
    const output = [1, 2, 3];

    expect(hlp.objToArr(input)).toEqual(output);
});

test('getNextNUrls', () => {
    const input = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    expect(hlp.getNextNUrls(input, 0)).toEqual([]);
    expect(hlp.getNextNUrls(input, 1)).toEqual([2]);
    expect(hlp.getNextNUrls(input, 2)).toEqual([2, 3]);
    expect(hlp.getNextNUrls(input, 3)).toEqual([2, 3, 4]);
});

test('buildCrawlPromisArray', () => {
    // Mock singleCrawl function that returns a promise
    const mockSingleCrawl = jest.fn(() => Promise.resolve('crawl result'));
    const config = {timeout: 5000};
    const appData = {visitedPages: new Set()};
    const custom = {customAction: true};

    // Test with empty array
    const emptyResult = hlp.buildCrawlPromisArray([], mockSingleCrawl, config, appData, custom);
    expect(emptyResult).toEqual([]);
    expect(mockSingleCrawl).not.toHaveBeenCalled();

    // Reset mock
    mockSingleCrawl.mockClear();

    // Test with multiple URLs
    const urls = ['http://example.com', 'http://test.com', 'http://demo.com'];
    const result = hlp.buildCrawlPromisArray(urls, mockSingleCrawl, config, appData, custom);

    // Verify return value is an array with correct length
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(urls.length);

    // Verify each element is a promise
    result.forEach((item) => {
        expect(item).toBeInstanceOf(Promise);
    });

    // Verify singleCrawl was called for each URL with correct parameters
    expect(mockSingleCrawl).toHaveBeenCalledTimes(urls.length);

    urls.forEach((url, index) => {
        expect(mockSingleCrawl).toHaveBeenNthCalledWith(index + 1, url, config, appData, custom);
    });

    // Test that the promises resolve correctly
    return Promise.all(result).then((results) => {
        expect(results).toEqual(['crawl result', 'crawl result', 'crawl result']);
    });
});
