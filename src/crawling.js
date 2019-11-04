const request = require('request-promise');
const cheerio = require('cheerio');
const URL = require('url-parse');

const crw = {

    /**
     * Crawl a single URL
     * @param {string} pageURL Url of the page to crawl
     * @param {json} config configuration json
     * @returns {objecy} page response
     */
    visitPage: (pageURL, config) => {
        let options = {
            uri: pageURL,
            timeout: config.timeout,
            resolveWithFullResponse: true,
            rejectUnauthorized: config.requireValidSSLCert,
            headers: {
                'User-Agent': 'Sauron'
            }
        };

        if (config.httpAuth.enable) {
            // let auth = new Buffer(config.httpAuth.user + ':' + config.httpAuth.pass).toString('base64');
            let auth = Buffer.from(config.httpAuth.user + ':' + config.httpAuth.pass).toString('base64');
            options.headers.Authorization = 'Basic ' + auth;
        }

        return request(options);
    },

    /**
     * Build page data object used as output
     * @param {object} response request response object
     * @param {boolean} isError is the response from request that returned an error
     * @param {string} pageURL url of the page response comes from
     * @param {object} counter crawl counter object
     * @returns {object} page data object
     */
    buildPageData: (response, isError, pageURL, counter) => {
        let { statusCode } = response;
        let pageBody   = response.body || response.message;
        let pageLinks  = pageBody ? crw.getLinksFromBody(pageBody, pageURL) : null;
        let pageTitle  = pageBody ? crw.getPageTitle(pageBody) : '';
        let errorData  = isError ? ((response.hasOwnProperty('message') && statusCode !== 404) ? response.message : statusCode) : false;
        let pageData = {
            id:     counter.crawled,
            url:    pageURL,
            title:  pageTitle,
            status: statusCode,
            links:  pageLinks ? pageLinks.url : [],
            mailto: pageLinks ? pageLinks.mailto : [],
            tel:    pageLinks ? pageLinks.tel : [],
            hash:   pageLinks ? pageLinks.hash : [],
            error:  errorData
        };

        // Construct page details object
        return pageData;
    },

    /**
     * Update list of urls to crawl
     * @param {array} linkArray array of urls to add to the list
     * @param {array} pagesToVisit current list
     * @param {object} visitedPages pages already crawled data object
     * @param {json} config configuration json
     * @returns {array} updated array of urls to crawl
     */
    updateCrawlList: (linkArray, pagesToVisit, visitedPages, config) => {
        linkArray.forEach((url) => {
            let sanitizedURL = config.stripGET ? crw.stripGET(crw.stripHash(url)) : crw.stripHash(url);
            let urlAlreadyVisited         = (sanitizedURL in visitedPages);
            let urlInAllowedDomains       = config.allowedDomains.length !== 0 ? crw.urlInDomains(sanitizedURL, config.allowedDomains) : true;
            let urlInAllowedProtocols     = config.allowedProtocols.length !== 0 ? crw.urlInProto(sanitizedURL, config.allowedProtocols) : true;

            if (!urlAlreadyVisited && urlInAllowedDomains && urlInAllowedProtocols && crw.checkConfigConditions(sanitizedURL, config.crawlLinks)) {
                pagesToVisit.push(sanitizedURL);
            }
        });

        return pagesToVisit;
    },

    /**
     * Get links from page body
     * @param {string} pageBody HTML markup of a page
     * @param {string} pageURL page url
     * @returns {array} array of links present on the page
     */
    getLinksFromBody: (pageBody, pageURL) => {
        let $ = cheerio.load(pageBody);
        let links = {
            url: [],
            mailto: [],
            tel: [],
            hash: [],
        };

        // Relative links
        $("a[href^='/']").each((_index, element) => {
            links.url.push(crw.relToAbs($(element).attr('href'), pageURL));
        });

        // Absolute links
        $("a[href^='http']").each((_index, element) => {
            links.url.push($(element).attr('href'));
        });

        // Mail links
        $("a[href^='mailto:']").each((_index, element) => {
            links.mailto.push($(element).attr('href'));
        });

        // Tel links
        $("a[href^='tel:']").each((_index, element) => {
            links.tel.push($(element).attr('href'));
        });

        // Hash links
        $("a[href^='#']").each((_index, element) => {
            links.hash.push($(element).attr('href'));
        });

        // Remove duplicates
        links.url = [...new Set(links.url)];
        links.mailto = [...new Set(links.mailto)];
        links.tel = [...new Set(links.tel)];
        links.hash = [...new Set(links.hash)];

        return links;

    },

    /**
     * Get page title from body
     * @param {string} body HTML markup of a page
     * @returns {string} page title
     */
    getPageTitle: (pageBody) => {
        let $ = cheerio.load(pageBody);
        return $('title').text() || undefined;
    },

    /**
     * Convert relative link to absolute link
     * @param {string} url url to convert
     * @param {string} parentURL url to get the host from
     * @returns {string} absolute url
     */
    relToAbs: (relUrl, parentURL) => {
        let url = new URL(parentURL);
        return url.protocol + '//' + url.hostname + relUrl;
    },

    /**
     * Check is given url in an array of allowed domains
     * @param {string} url url to test
     * @param {string} domains array to test agains
     * @returns {boolean}
     */
    urlInDomains: (url, domains) => {
        let { hostname } = new URL(url);

        return domains.indexOf(hostname) !== -1 ? true : false;
    },

    /**
     * Check is given url in an array of allowed protocols
     * @param {string} url url to test
     * @param {string} protos array to test agains
     * @returns {boolean}
     */
    urlInProto: (url, protocols) => {
        let { protocol } = new URL(url);
        return protocols.indexOf(protocol) !== -1 ? true : false;
    },

    /**
     * Check is given url in an array of allowed pathnames
     * @param {string} url url to test
     * @param {string} pathname array to test agains
     * @returns {boolean}
     */
    urlInPathname: (url, pathnames) => {
        let { pathname } = new URL(url);
        let inPath = false;

        pathnames.forEach((path) => {
            if (pathname.indexOf(path) === 0) {
                inPath = true;
            }
        });

        return inPath;
    },

    /**
     * Check pageURL regExp patterns and pathnames against config object
     * @param {string} pageURL url of the page to check against
     * @param {object} configObj config object
     * @returns {boolean}
     */
    checkConfigConditions: (pageURL, configObj) => {
        let patter        = new RegExp(configObj.pattern, 'g');
        let pathnameAllow = configObj.pathnameAllow.length !== 0 ? crw.urlInPathname(pageURL, configObj.pathnameAllow) : true;
        let pathnameDeny  = configObj.pathnameDeny.length !== 0 ? crw.urlInPathname(pageURL, configObj.pathnameDeny) : false;

        return (pageURL.match(patter) && pathnameAllow && !pathnameDeny);
    },

    /**
     * Strip hash from url
     * @param {string} url input url
     * @returns {string} url without hash
     */
    stripHash: (url) => {
        if (url.indexOf('#') !== -1) {
            return url.split('#')[0];
        }

        return url;
    },

    /**
     * Strip GET parameter from url
     * @param {string} url input url
     * @returns {string} url without GET
     */
    stripGET: (url) => {
        if (url.indexOf('?') !== -1) {
            return url.split('?')[0];
        }

        return url;
    }

};

module.exports = crw;
