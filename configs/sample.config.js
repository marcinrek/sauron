/**
 * Sauron Crawler Configuration
 *
 * Configuration options:
 * - id: Crawl id - used in output file name etc.
 * - startURL: Url to start crawl from
 * - sitemapURL: when provided, crawler will use sitemap.xml to get list of pages to crawl
 * - output: Crawl output method. Allowed values: console, csv, json, blank
 * - storeDefaultData: Store default 'output' data with links, statusCodes etc - can be disabled when output is set to 'blank'
 * - custom: Custom parsing actions settings
 * - allowedDomains: Only domains from this array will be crawled. Empty array will discard this check.
 * - allowedProtocols: Page protocols to crawl. Allowed values: http, https. Empty array will discard this check.
 * - dedupeProtocol: De-duplicate links based on protocol.
 * - allowLinksFrom: Only links that are found on a urls that match given requirements will be crawled
 * - crawlLinks: Only links that match given requirements will be crawled
 * - saveCrawlData: Only links that match given requirements will be saved to output
 * - httpAuth: Settings for basic authentication
 * - cookies: Array of cookies represented by an object with keys: key and value
 * - customHeaders: Object containg custom headers to be send with each request
 * - requireValidSSLCert: Check is SSL certificates valid
 * - saveStatusEach: Save status each N crawls to enable abort and continue later
 * - verbose: Print more output to console
 * - requestCount: Number of requests to be run in one batch
 * - maxPages: Max pages to crawl. To have no limit set -1
 * - stripGET: Strip GET parameters from links
 * - timeout: Single request timeout in ms
 * - linksToLowercase: Change all links to lowercase
 */

module.exports = {
    id: 'testPage',
    startURL: 'http://localhost:8080/',
    sitemapURL: 'http://localhost:8080/sitemap.xml',
    output: 'json',
    storeDefaultData: true,
    custom: {
        useCustom: true,
        customFile: 'extract.images',
    },
    allowedDomains: ['localhost'],
    allowedProtocols: ['http:', 'https:'],
    dedupeProtocol: true,
    allowLinksFrom: {
        pattern: '^.*',
        pathnameAllow: [],
        pathnameDeny: [],
    },
    crawlLinks: {
        pattern: '^.*',
        pathnameAllow: [],
        pathnameDeny: [],
    },
    saveCrawlData: {
        pattern: '^.*',
        pathnameAllow: [],
        pathnameDeny: [],
    },
    httpAuth: {
        enable: false,
        user: 'login',
        pass: 'pass',
    },
    cookies: [
        {
            key: 'testCookie',
            value: 'test-value',
        },
    ],
    customHeaders: {
        'User-Agent': 'Mozilla/5.0 (SAURON NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
    },
    requireValidSSLCert: false,
    saveStatusEach: 3,
    verbose: false,
    requestCount: 2,
    maxPages: -1,
    stripGET: false,
    timeout: 5000,
    linksToLowercase: false,
};
