const crw = require('crawling');

test('stripGET', () => {
    expect(crw.stripGET('https://test.url')).toBe('https://test.url');
    expect(crw.stripGET('https://test.url?a=1&b=2')).toBe('https://test.url');
    expect(crw.stripGET('https://test.url?a=1&b=2#123')).toBe('https://test.url#123');
});

test('stripHash', () => {
    expect(crw.stripHash('https://test.url')).toBe('https://test.url');
    expect(crw.stripHash('https://test.url?a=1&b=2')).toBe('https://test.url?a=1&b=2');
    expect(crw.stripHash('https://test.url?a=1&b=2#123')).toBe('https://test.url?a=1&b=2');
});
