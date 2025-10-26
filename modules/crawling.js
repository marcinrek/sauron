const axios = require('axios');
const jsdom = require('jsdom');
const {JSDOM} = jsdom;
const {URL} = require('url');
const hlp = require('./helpers');
const chalk = require('chalk');
const {parseStringPromise} = require('xml2js');

const crw = {
    // Single page crawl
    singleCrawl: async (pageURL, config, appData, custom) => {
        let responsePass;
        let errorResponse = false;

        console.log(`About to crawl: ${chalk.blue(pageURL)}`);

        /**
         * Make a single request to a page
         */
        try {
            // Visit page
            const crawlResult = await crw.visitPage(pageURL, config);

            // Assign responce to a responsePass variable
            responsePass = crawlResult;
        } catch (error) {
            // Flag error
            errorResponse = true;

            // Assign error to a responsePass variable
            responsePass = error;
        } finally {
            // Build page data object
            let pageData = crw.buildPageData(responsePass, errorResponse, pageURL, appData.counter, config?.linksToLowercase || false);

            // Build custom response object
            if (config.custom.useCustom) {
                await custom.action(responsePass, errorResponse, pageURL, appData.counter, config);
            }

            // Save currently visited page data for output
            if (crw.checkConfigConditions(pageURL, config.saveCrawlData) && config.storeDefaultData) {
                appData.outputData[pageURL] = pageData;
            }

            // Mark page as crawled
            appData.visitedPages.add(pageURL);

            // Work on pagesToVisit only if crawled url matches pattern
            if (crw.checkConfigConditions(pageURL, config.allowLinksFrom)) {
                // Add new links to list if it matches config.allowLinksFromPatter pattern
                crw.updateCrawlList(pageData.links, appData.pagesToVisit, appData.visitedPages, appData.discardedPages, config).forEach((url) => appData.pagesToVisit.add(url));
            }

            // Remove currently visited page from list
            appData.pagesToVisit.delete(pageURL);

            // Inc counters
            appData.counter.crawled += 1;

            // Display info about which page is going to be crawled
            let finished = appData.counter.crawled;
            let total = appData.counter.crawled + appData.pagesToVisit.size;
            let percent = Math.round((finished / total) * 10000) / 100;
            console.log(`${finished} of ${total} (${percent}%) [${chalk.yellow(hlp.getTimestamp('HH:mm:ss'))}] Crawling: ${chalk.green(pageURL)}`);

            // Mark that save is required
            if (!(appData.counter.crawled % config.saveStatusEach) && config.saveStatusEach !== -1) {
                appData.saveRequired = true;
            }
        }
    },

    /**
     * Check is pageURL mime type allowed to be crawled
     * @param {Array} allowedMimeTypes array of allowed mime types
     * @param {String} mimeType tested mimeType
     * @returns {Boolean} true when allowed
     */
    validateHEADMimeType: (allowedMimeTypes, mimeType) => {
        if (!mimeType) return false;
        const normalized = mimeType.toLowerCase();
        return allowedMimeTypes.some((t) => normalized.includes(String(t).toLowerCase()));
    },

    /**
     * Crawl a single URL
     * @param {string} pageURL Url of the page to crawl
     * @param {json} config configuration json
     * @returns {objecy} page response
     */
    visitPage: async (pageURL, config) => {
        // Prepare cookies
        let cookies = '';
        if (config.cookies && config.cookies.length) {
            cookies = config.cookies
                .map((cookie) => {
                    return `${cookie.key}=${cookie.value}`;
                })
                .join('; ');
        }

        // Prepare options
        const options = {
            url: pageURL,
            timeout: config.timeout,
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            },
            headers: {
                ...config.customHeaders,
                Cookie: cookies,
            },
            httpsAgent: new (require('https').Agent)({
                rejectUnauthorized: config.requireValidSSLCert,
            }),
        };

        // HTTP Auth
        if (config.httpAuth && config.httpAuth.enable) {
            const auth = Buffer.from(`${config.httpAuth.user}:${config.httpAuth.pass}`).toString('base64');
            options.headers.Authorization = `Basic ${auth}`;
        }

        /**
         * HEAD check
         */
        if (config.headCheck.enabled) {
            // Check pattern
            if (config.headCheck.pattern.test(pageURL)) {
                console.log(chalk.magenta(`Performing HEAD check on ${pageURL} ...`));

                // Rewrite options to change request type but keep the rest
                const headOption = {...options};
                headOption.method = 'HEAD';

                // Make head request
                const headResponse = await axios(headOption);
                const validMimeType = crw.validateHEADMimeType(config.headCheck.crawlMIMETypes, headResponse.headers['content-type']);

                // Return instantly when mimeType not valid
                if (!validMimeType) {
                    console.log(chalk.red(`"${pageURL}" mimeType is "${headResponse.headers['content-type']}" - will not crawl.`));
                    return {
                        statusCode: headResponse.status,
                        headers: headResponse.headers,
                        body: '',
                        raw: headResponse,
                    };
                } else {
                    console.log(chalk.green(`"${pageURL}" mimeType is "${headResponse.headers['content-type']}" - crawling.`));
                }
            }
        }

        // Make request
        try {
            const response = await axios(options);
            return {
                statusCode: response.status,
                headers: response.headers,
                body: response.data,
                raw: response,
            };
        } catch (error) {
            if (error.response) {
                return {
                    statusCode: error.response.status,
                    headers: error.response.headers,
                    body: error.response.data,
                };
            } else {
                throw error;
            }
        }
    },

    /**
     * Build page data object used as output
     * @param {object} response request response object
     * @param {boolean} isError is the response from request that returned an error
     * @param {string} pageURL url of the page response comes from
     * @param {object} counter crawl counter object
     * @param {boolean} linksToLowercase change all links to lowercase
     * @returns {object} page data object
     */
    buildPageData: (response, isError, pageURL, counter, linksToLowercase) => {
        let {statusCode} = response;
        let pageBody = response.body || response.message;
        let pageLinks = pageBody ? crw.getLinksFromBody(pageBody, pageURL, linksToLowercase) : null;
        let pageTitle = pageBody ? crw.getPageTitle(pageBody) : '';
        let errorData = isError ? (Object.prototype.hasOwnProperty.call(response, 'message') && statusCode !== 404 ? response.message : statusCode) : false;
        let pageData = {
            id: counter.crawled,
            url: pageURL,
            title: pageTitle,
            status: statusCode,
            links: pageLinks ? pageLinks.url : [],
            mailto: pageLinks ? pageLinks.mailto : [],
            tel: pageLinks ? pageLinks.tel : [],
            hash: pageLinks ? pageLinks.hash : [],
            error: errorData,
        };

        // Construct page details object
        return pageData;
    },

    /**
     * Update list of urls to crawl
     * @param {array} linkArray array of urls to add to the list
     * @param {array} pagesToVisit current list
     * @param {object} visitedPages pages already crawled data object
     * @param {array} discardedPages pages that are discarded from crawling due to config
     * @param {json} config configuration json
     * @returns {array} updated array of urls to crawl
     */
    updateCrawlList: (linkArray, pagesToVisit, visitedPages, discardedPages, config) => {
        let tempDiscardedPages = [];
        // let properLinksCount = 0;
        // let newLinksCount = linkArray.length;
        // let pagesToVisitCount = pagesToVisit.size;

        // Define urlTransformFunc with a default function that returns the url as is
        const urlTransformFunc = config?.urlTransformFunc || ((url) => url);

        // Loop new links
        linkArray.forEach((url) => {
            let urlAlreadyVisited = false;
            let dedupedUrlAlreadyVisited = false;
            let sanitizedURL = config.stripGET ? crw.stripGET(crw.stripHash(url)) : crw.stripHash(url);

            if (config.dedupeProtocol && config.allowedProtocols.length > 1) {
                //FIXME: Don't hardcode protocols
                if (sanitizedURL.indexOf('http://') === 0) {
                    dedupedUrlAlreadyVisited = visitedPages.has(sanitizedURL.replace('http://', 'https://'));
                } else {
                    dedupedUrlAlreadyVisited = visitedPages.has(sanitizedURL.replace('https://', 'http://'));
                }
            }

            // Modify url if urlModifyFunc is provided
            sanitizedURL = urlTransformFunc(sanitizedURL);

            // URL is not null
            if (sanitizedURL) {
                urlAlreadyVisited = visitedPages.has(sanitizedURL);

                let urlInAllowedDomains = config.allowedDomains.length !== 0 ? crw.urlInDomains(sanitizedURL, config.allowedDomains) : true;
                let urlInAllowedProtocols = config.allowedProtocols.length !== 0 ? crw.urlInProto(sanitizedURL, config.allowedProtocols) : true;
                let validateCrawlLinks = crw.checkConfigConditions(sanitizedURL, config.crawlLinks);

                if (!urlAlreadyVisited && !dedupedUrlAlreadyVisited && urlInAllowedDomains && urlInAllowedProtocols && validateCrawlLinks) {
                    // properLinksCount += 1;
                    pagesToVisit.add(sanitizedURL);
                } else if (dedupedUrlAlreadyVisited) {
                    if (config.verbose) {
                        console.log(`Deduped URL: ${chalk.cyan(sanitizedURL)}`);
                    }
                } else if (!validateCrawlLinks) {
                    if (config.verbose) {
                        tempDiscardedPages.push(sanitizedURL);
                    }
                    discardedPages.add(sanitizedURL);
                }
            }
        });

        // Print discarded urls info
        if (tempDiscardedPages.length) {
            console.log(
                chalk.magenta(`Discarded due to crawlLinks config: [${tempDiscardedPages[0]}${tempDiscardedPages.length > 1 ? ' +' + (tempDiscardedPages.length - 1) + ']' : ']'}`),
            );
        }

        // Print links count
        // console.log(chalk.cyan(`Links found: ${newLinksCount} | Proper: ${properLinksCount} | Added: ${pagesToVisit.size - pagesToVisitCount} `));

        return pagesToVisit;
    },

    /**
     * Get links from page body
     * @param {string} pageBody HTML markup of a page
     * @param {string} pageURL page url
     * @returns {array} array of links present on the page
     */
    getLinksFromBody: (pageBody, pageURL, linksToLowercase) => {
        const dom = new JSDOM(pageBody, {url: pageURL});
        const document = dom.window.document;

        const links = {
            url: [],
            mailto: [],
            tel: [],
            hash: [],
        };

        // Helper function to convert relative URLs to absolute
        //const relToAbs = (rel, base) => new URL(rel, base).href;

        // Function to process links
        const processLinks = (selector, linkType, linksToLowercase) => {
            document.querySelectorAll(selector).forEach((element) => {
                const href = linksToLowercase ? element.getAttribute('href').toLowerCase() : element.getAttribute('href');
                if (linkType === 'url' && (href.startsWith('/') || href.startsWith('?'))) {
                    links[linkType].push(crw.relToAbs(href, pageURL));
                } else {
                    links[linkType].push(href);
                }
            });
        };

        // Process different types of links
        processLinks("a[href^='?'], a[href^='/'], a[href^='http']", 'url', linksToLowercase);
        processLinks("a[href^='mailto:']", 'mailto', linksToLowercase);
        processLinks("a[href^='tel:']", 'tel', linksToLowercase);
        processLinks("a[href^='#']", 'hash', linksToLowercase);

        // Remove duplicates
        for (const key in links) {
            links[key] = [...new Set(links[key])];
        }

        return links;
    },

    /**
     * Get page title from body
     * @param {string} body HTML markup of a page
     * @returns {string} page title
     */
    getPageTitle: (pageBody) => {
        const dom = new JSDOM(pageBody);
        const titleElement = dom.window.document.querySelector('title');
        return titleElement ? titleElement.textContent : undefined;
    },

    /**
     * Convert relative link to absolute link
     * @param {string} url url to convert
     * @param {string} parentURL url to get the host from
     * @returns {string} absolute url
     */
    relToAbs: (relUrl, parentURL) => {
        let url = new URL(parentURL);

        if (relUrl[0] === '/') {
            return `${url.protocol}//${url.hostname}${parseInt(url.port, 10) !== 80 && url.port !== '' ? `:${url.port}` : ''}${relUrl}`;
        } else if (relUrl[0] === '?') {
            return `${url.protocol}//${url.hostname}${parseInt(url.port, 10) !== 80 && url.port !== '' ? `:${url.port}` : ''}${url.pathname}${relUrl}`;
        } else {
            return `${url.protocol}//${url.hostname}${parseInt(url.port, 10) !== 80 && url.port !== '' ? `:${url.port}` : ''}${url.pathname}/${relUrl}`;
        }
    },

    /**
     * Check is given url in an array of allowed domains
     * @param {string} url url to test
     * @param {array} domains array of strings or regex patterns to test against
     * @returns {boolean}
     */
    urlInDomains: (url, domains) => {
        try {
            let {hostname} = new URL(url);

            // Check each domain entry (string or regex)
            for (let domain of domains) {
                // If domain is a RegExp object, test against it
                if (domain instanceof RegExp) {
                    if (domain.test(hostname)) {
                        return true;
                    }
                }
                // If domain is a string, check for exact match
                else if (typeof domain === 'string') {
                    if (hostname === domain) {
                        return true;
                    }
                }
            }

            return false;
        } catch (err) {
            console.log(err);
            return false;
        }
    },

    /**
     * Check is given url in an array of allowed protocols
     * @param {string} url url to test
     * @param {string} protos array to test agains
     * @returns {boolean}
     */
    urlInProto: (url, protocols) => {
        try {
            let {protocol} = new URL(url);
            return protocols.indexOf(protocol) !== -1 ? true : false;
        } catch (err) {
            console.log(err);
            return false;
        }
    },

    /**
     * Check is given url in an array of allowed pathnames
     * @param {string} url url to test
     * @param {string} pathname array to test agains
     * @param {boolean} stripGET if false will look in whole of URL
     * @returns {boolean}
     */
    urlInPathname: (url, pathnames, stripGET) => {
        try {
            let {pathname} = new URL(url);
            let inPath = false;

            pathnames.forEach((path) => {
                if (pathname.indexOf(path) !== -1) {
                    inPath = true;
                }
                if (!stripGET) {
                    if (url.indexOf(path) !== -1) {
                        inPath = true;
                    }
                }
            });

            return inPath;
        } catch (err) {
            console.log(err);
            return false;
        }
    },

    /**
     * Check pageURL regExp patterns and pathnames against config object
     * @param {string} pageURL url of the page to check against
     * @param {object} configObj config object
     * @returns {boolean}
     */
    checkConfigConditions: (pageURL, configObj) => {
        let pathnameAllow = configObj.pathnameAllow.length !== 0 ? crw.urlInPathname(pageURL, configObj.pathnameAllow, configObj.stripGET) : true;
        let pathnameDeny = configObj.pathnameDeny.length !== 0 ? crw.urlInPathname(pageURL, configObj.pathnameDeny, configObj.stripGET) : false;

        return configObj.pattern.test(pageURL) && pathnameAllow && !pathnameDeny;
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
            let hash = '';
            if (url.indexOf('#') !== -1) {
                hash = `#${url.split('#')[1]}`;
            }
            return `${url.split('?')[0]}${hash}`;
        }

        return url;
    },

    /**
     * Fetches a sitemap XML from the given URL and extracts all URLs listed in it.
     * Handles both standard sitemaps (<urlset>) and sitemap indexes (<sitemapindex>) recursively.
     *
     * @async
     * @function extractUrlsFromSitemap
     * @param {string} sitemapUrl - The URL to the sitemap.xml file.
     * @returns {Promise<string[]>} A promise that resolves to an array of URLs found in the sitemap.
     * @throws Will not throw, but will log errors and return an empty array on failure.
     *
     * @example
     * extractUrlsFromSitemap('https://example.com/sitemap.xml')
     *   .then(urls => console.log(urls));
     */
    extractUrlsFromSitemap: async (sitemapUrl) => {
        try {
            // Fetch the sitemap XML
            const response = await axios.get(sitemapUrl);
            const xmlData = response.data;

            // Parse the XML
            const parsed = await parseStringPromise(xmlData);

            // Extract URLs from <urlset>
            if (parsed.urlset && parsed.urlset.url) {
                return parsed.urlset.url.map((entry) => entry.loc[0].trim());
            }

            // Handle sitemap index (nested sitemaps)
            if (parsed.sitemapindex && parsed.sitemapindex.sitemap) {
                // Recursively fetch URLs from nested sitemaps
                const nestedUrls = await Promise.all(parsed.sitemapindex.sitemap.map((s) => crw.extractUrlsFromSitemap(s.loc[0].trim())));
                return nestedUrls.flat();
            }

            // No URLs found
            return [];
        } catch (error) {
            console.error('Error fetching or parsing sitemap:', error.message);
            return [];
        }
    },
};

module.exports = crw;
