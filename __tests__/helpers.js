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
    const c1 = {};
    const singleCrawl = () => {};
    const config = {};
    const appData = {};
    const custom = {};

    expect(hlp.buildCrawlPromisArray(c1, [], singleCrawl, config, appData, custom).length).toBe([].length + 1);
    expect(hlp.buildCrawlPromisArray(c1, [1, 2, 3], singleCrawl, config, appData, custom).length).toBe([1, 2, 3].length + 1);
});
