const crw = require('crawling');
const axios = require('axios');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

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
        pattern: new RegExp('^(https://).*some_path.*', 'i'),
        pathnameAllow: ['another', '/even_more_path/'],
        pathnameDeny: ['.pdf', '.jpg'],
    };
    const config2 = {
        pattern: new RegExp('^.*', 'i'),
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
    const url = 'https://subdomain.test.url/web_path';

    expect(crw.urlInDomains(url, ['subdomain.test.url', 'test.url.com'])).toBe(true);
    expect(crw.urlInDomains(url, ['test.url', 'test.url.com'])).toBe(false);
    expect(crw.urlInDomains(url, ['test.url', /.+\.test\.url/gi])).toBe(true);
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

// Tests for extractUrlsFromSitemap function
describe('extractUrlsFromSitemap', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock console.error to avoid cluttering test output
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    test('should extract URLs from a standard sitemap', async () => {
        const mockSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url>
                <loc>https://example.com/page1</loc>
                <lastmod>2023-01-01</lastmod>
            </url>
            <url>
                <loc>https://example.com/page2</loc>
                <lastmod>2023-01-02</lastmod>
            </url>
            <url>
                <loc>https://example.com/page3</loc>
                <lastmod>2023-01-03</lastmod>
            </url>
        </urlset>`;

        mockedAxios.get.mockResolvedValue({
            data: mockSitemapXml,
        });

        const result = await crw.extractUrlsFromSitemap('https://example.com/sitemap.xml');

        expect(result).toEqual(['https://example.com/page1', 'https://example.com/page2', 'https://example.com/page3']);
        expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com/sitemap.xml');
    });

    test('should handle sitemap index with nested sitemaps', async () => {
        const mockSitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <sitemap>
                <loc>https://example.com/sitemap1.xml</loc>
                <lastmod>2023-01-01</lastmod>
            </sitemap>
            <sitemap>
                <loc>https://example.com/sitemap2.xml</loc>
                <lastmod>2023-01-02</lastmod>
            </sitemap>
        </sitemapindex>`;

        const mockSitemap1 = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url>
                <loc>https://example.com/page1</loc>
            </url>
            <url>
                <loc>https://example.com/page2</loc>
            </url>
        </urlset>`;

        const mockSitemap2 = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url>
                <loc>https://example.com/page3</loc>
            </url>
            <url>
                <loc>https://example.com/page4</loc>
            </url>
        </urlset>`;

        mockedAxios.get.mockResolvedValueOnce({data: mockSitemapIndex}).mockResolvedValueOnce({data: mockSitemap1}).mockResolvedValueOnce({data: mockSitemap2});

        const result = await crw.extractUrlsFromSitemap('https://example.com/sitemap.xml');

        expect(result).toEqual(['https://example.com/page1', 'https://example.com/page2', 'https://example.com/page3', 'https://example.com/page4']);
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    test('should return empty array for empty sitemap', async () => {
        const mockEmptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        </urlset>`;

        mockedAxios.get.mockResolvedValue({
            data: mockEmptySitemap,
        });

        const result = await crw.extractUrlsFromSitemap('https://example.com/sitemap.xml');

        expect(result).toEqual([]);
    });

    test('should return empty array for sitemap with no URL elements', async () => {
        const mockSitemapNoUrls = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url>
                <lastmod>2023-01-01</lastmod>
            </url>
        </urlset>`;

        mockedAxios.get.mockResolvedValue({
            data: mockSitemapNoUrls,
        });

        const result = await crw.extractUrlsFromSitemap('https://example.com/sitemap.xml');

        expect(result).toEqual([]);
    });

    test('should handle network errors gracefully', async () => {
        mockedAxios.get.mockRejectedValue(new Error('Network error'));

        const result = await crw.extractUrlsFromSitemap('https://example.com/sitemap.xml');

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching or parsing sitemap:', 'Network error');
    });

    test('should handle invalid XML gracefully', async () => {
        mockedAxios.get.mockResolvedValue({
            data: 'invalid xml content',
        });

        const result = await crw.extractUrlsFromSitemap('https://example.com/sitemap.xml');

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Error fetching or parsing sitemap:', expect.any(String));
    });

    test('should handle sitemap with neither urlset nor sitemapindex', async () => {
        const mockOtherXml = `<?xml version="1.0" encoding="UTF-8"?>
        <root>
            <data>some other xml structure</data>
        </root>`;

        mockedAxios.get.mockResolvedValue({
            data: mockOtherXml,
        });

        const result = await crw.extractUrlsFromSitemap('https://example.com/sitemap.xml');

        expect(result).toEqual([]);
    });

    test('should handle nested sitemap index recursively', async () => {
        const mockNestedSitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <sitemap>
                <loc>https://example.com/nested-sitemap.xml</loc>
            </sitemap>
        </sitemapindex>`;

        const mockNestedSitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <sitemap>
                <loc>https://example.com/final-sitemap.xml</loc>
            </sitemap>
        </sitemapindex>`;

        const mockFinalSitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url>
                <loc>https://example.com/final-page</loc>
            </url>
        </urlset>`;

        mockedAxios.get.mockResolvedValueOnce({data: mockNestedSitemapIndex}).mockResolvedValueOnce({data: mockNestedSitemap}).mockResolvedValueOnce({data: mockFinalSitemap});

        const result = await crw.extractUrlsFromSitemap('https://example.com/sitemap.xml');

        expect(result).toEqual(['https://example.com/final-page']);
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
});

test('validateHEADMimeType', () => {
    const allowedMimeTypesArray = ['text/html', 'application/xhtml+xml'];

    expect(crw.validateHEADMimeType(allowedMimeTypesArray, 'text/html; charset=UTF-8')).toBe(true);
    expect(crw.validateHEADMimeType(allowedMimeTypesArray, 'TEXT/HtMl; charset=UTF-16')).toBe(true);
    expect(crw.validateHEADMimeType(allowedMimeTypesArray, 'image/svg+xml')).toBe(false);
    expect(crw.validateHEADMimeType([], 'text/html; charset=UTF-8')).toBe(false);
});
