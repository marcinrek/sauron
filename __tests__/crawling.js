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

test('checkConfigConditions', () => {
    const config1 = {
        pattern: '^(https://).*some_path.*',
        pathnameAllow: ['another', '/even_more_path/'],
        pathnameDeny: ['.pdf', '.jpg'],
    };
    const config2 = {
        pattern: '^.*',
        pathnameAllow: [],
        pathnameDeny: ['.pdf', '.jpg'],
    };
    const url1 = 'https://test.url/some_path/another_path/even_more_path/test.pdf';
    const url2 = 'https://test.url/some_path/another_path/even_more_path/test';
    const url3 = 'https://test.url/some_path_2/path/path/test';
    const url4 = 'https://test.url/even_more_path/test';

    expect(crw.checkConfigConditions(url1, config1)).toBe(false); // fails on pathnameDeny
    expect(crw.checkConfigConditions(url2, config1)).toBe(true); // passes on all
    expect(crw.checkConfigConditions(url3, config1)).toBe(false); // fails on pathnameAllow
    expect(crw.checkConfigConditions(url4, config1)).toBe(false); // fails on pattern
    expect(crw.checkConfigConditions(url1, config2)).toBe(false); // fails on pathnameDeny
    expect(crw.checkConfigConditions(url2, config2)).toBe(true); // passes on all
    expect(crw.checkConfigConditions(url3, config2)).toBe(true); // passes on all
    expect(crw.checkConfigConditions(url4, config2)).toBe(true); // passes on all
});

test('urlInPathname', () => {
    const url1 = 'https://test.url/some_path/another_path/even_more_path/test.pdf';
    const url2 = 'https://test.url/some_path/another_path/even_more_path/test?xxx=123';

    expect(crw.urlInPathname(url1, ['some_path', 'even'], true)).toBe(true);
    expect(crw.urlInPathname(url1, ['even'], true)).toBe(true);
    expect(crw.urlInPathname(url1, ['nopresent'], true)).toBe(false);
    expect(crw.urlInPathname(url2, ['nopresent'], false)).toBe(false);
    expect(crw.urlInPathname(url2, ['xxx'], false)).toBe(true);
    expect(crw.urlInPathname(url2, ['123'], false)).toBe(true);
    expect(crw.urlInPathname(url2, ['xxx'], true)).toBe(false);
    expect(crw.urlInPathname(url2, ['123'], true)).toBe(false);
});

test('urlInProto', () => {
    const url1 = 'https://test.url/web_path';
    const url2 = 'http://test.url/web_path';
    const url3 = 'ftp://test.url/web_path';
    const url4 = 'http://test.url/web_path/https';

    expect(crw.urlInProto(url1, ['http:', 'https:'])).toBe(true);
    expect(crw.urlInProto(url2, ['http:', 'https:'])).toBe(true);
    expect(crw.urlInProto(url3, ['http:', 'https:'])).toBe(false);
    expect(crw.urlInProto(url3, ['http:', 'https:', 'ftp:'])).toBe(true);
    expect(crw.urlInProto(url4, ['https:'])).toBe(false);
    expect(crw.urlInProto(url4, ['http:'])).toBe(true);
});

test('urlInDomains', () => {
    const url = 'https://test.url/web_path';

    expect(crw.urlInDomains(url, ['test.url', 'test.url.com'])).toBe(true);
    expect(crw.urlInDomains(url, ['test.url.com'])).toBe(false);
});

test('relToAbs', () => {
    expect(crw.relToAbs('/test/path/name', 'https://test.url.com/sample')).toBe('https://test.url.com/test/path/name');
    expect(crw.relToAbs('test/path/name', 'https://test.url.com/sample')).toBe('https://test.url.com/sample/test/path/name');
    expect(crw.relToAbs('?test/path/name', 'https://test.url.com/sample')).toBe('https://test.url.com/sample?test/path/name');
});

test('getPageTitle', () => {
    const pageBody = `<html><head><title>Test title</title></head><body><h1>Testing</h1></body></html>`;
    expect(crw.getPageTitle(pageBody)).toBe('Test title');
});
