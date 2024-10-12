# Basic page crawler written in Node.js

Crawler is designed to work as a test tool. It can extract all links from a given site along with additional information like statusCode, page title etc. This can be then displayed on console or dumped to csv or json file.

## Example use cases
* check site for broken (404) links
* extract image urls from site
* crawl auction/ecommerce pages to calculate avarage prices
* extract all phone numbers from site

## Requirements 
Starting from version 1.3.0 Node version >= 15 may be required.
Starting from version 2.0.0 Node version >= 18.16.0 is required.

## NPM version usage - from version 2.0.0
* create a folder in the project root directory to store all related files for example ___crawler___

* create ___sauron.settings.js___ file in the root project directory
```
module.exports = {
    comments: {
        customDirectory: 'Directory to store custom parsing functions',
        outputDirectory: 'Directory to store output files',
        saveDirectory: 'Directory to store save files',
    },
    customDirectory: './crawler/custom/',
    outputDirectory: './crawler/output/',
    saveDirectory: './crawler/save/',
};
```

* all "custom" (custom.customFile) js files must be placed in the ___customDirectory___ specified above. 
In the config file provide a path relative to that folder. 

* crawl based on a config file
```
npx sauron .\configs\sample.config.json 
```
* same as above but start with a list of urls
```
npx sauron .\configs\sample.config.json .\configs\list.input.json
```

## Config file example
```
{
    "id":             "projectId",
    "startURL":       "http://example.com",
    "output":         "json",
    "storeDefaultData": true,
    "custom": {
        "useCustom": true,
        "customFile": "custom.blank"
    },
    "allowedDomains": [
        "example.com",
        "test.example.com"
    ],
    "allowedProtocols": [
        "http:",
        "https:"
    ],
    "dedupeProtocol": true,
    "allowLinksFrom": {
        "pattern":        "^.*",
        "pathnameAllow": [],
        "pathnameDeny":  []
    },
    "crawlLinks": {
        "pattern":       "^.*",
        "pathnameAllow": [],
        "pathnameDeny":  []
    },
    "saveCrawlData": {
        "pattern":       "^.*",
        "pathnameAllow": [],
        "pathnameDeny":  []
    },
    "httpAuth": {
        "enable": false,
        "user":   "login",
        "pass":   "pass"
    },
    "cookies": [
        {
            "key": "testCookie",
            "value": "test-value"
        }
    ],
    "customHeaders": {
        "User-Agent": "Mozilla/5.0 (SAURON NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0"
    },
    "requireValidSSLCert": false,
    "saveStatusEach": 1000,
    "verbose": false,
    "requestCount": 4,
    "maxPages": -1,
    "stripGET": false,
    "timeout":  5000
}
```

### Config file docs
| Option              | Value         | Description                                                          |
| ------------------- |:-------------:| -------------------------------------------------------------------- |
| ```id```          | ```string```  | Crawl id - used in output file name etc. |
| ```startURL```       | ```string```  | Url to start crawl from                         |
| ```output```      | ```string```  | Crawl output method. Allowed values: ```console```, ```csv ```, ```json ```, ```blank ```        |
| ```storeDefaultData```      | ```boolean```  | Store default 'output' data with links, statusCodes etc - can be disabled when output is set to 'blank'        |
| ```custom```      | ```object```  | Custom parsing actions settings        |
| ```allowedDomains```        | ```array```  | Only domains from this array will be crawled. Empty array will discard this check.               |
| ```allowedProtocoles```       | ```array```  | Page protocols to crawl. Allowed values: ```http```, ```https```. Empty array will discard this check.   |
| ```dedupeProtocol```        | ```boolean```  | De-duplicate links based on protocol.               |
| ```allowLinksFrom```       | ```object```  | Only links that are found on a urls that matche given requirements will be crawled.   |
| ```crawlLinks```       | ```object```  | Only links that matche given requirements will be crawled. Example patter to exclude "/files/" path and PDF files ```^(.(?!.*\\/files\\/|.*\\.pdf$))*```   |
| ```saveCrawlData```       | ```object```  | Only links that matche given requirements will be saved to output.   |
| ```httpAuth```       | ```object```  | Settings for basic authentication   |
| ```cookies```       | ```array```  | Array of cookies represented by an object with keys: key and value   |
| ```customHeaders```       | ```object```  | Object containg custom headers to be send with each request   |
| ```requireValidSSLCert```       | ```boolean```  | Check is SSL certificates valid   |
| ```saveStatusEach```      | ```number```  | Save status each N crawls to enable abort and continue later   |
| ```verbose```      | ```boolean```  | Print more output to console   |
| ```requestCount```      | ```number```  | Number of requests to be run in one batch   |
| ```maxPages```      | ```number```  | Max pages to crawl. To have no limit set ```-1```   |
| ```stripGET```      | ```boolean```  | Strip GET parameters from links   |
| ```timeout```      | ```number```  | Single request timeout in ms   |

## Changelog
* v3.2.0
    * add "raw" key to response which contains full axios response object
* v3.1.0
    * make custom action async
* v3.0.0
    * update required npm packages versions
    * move from request-promise to axios
        * now cookies array has only key and value keys and cookieURL configuration option is removed
    * add customHeaders configuration option
    * remove cheerio in favour of jsdom
* v2.0.0
    * moving to npm package usage
* v1.4.6
    * add jest test
    * minor fixes
* v1.4.5
    * save custom.data with "saveStatusEach" - now when custom action has a "data" property, which can be an array or an object, it will be stored in the save file every N crawled URLs
    * tidy sample config items position and descriptions
* v1.4.0
    * saves each output so separate directory under ./output with name equal to crawl start time
    * when stripGET is enabled pathAllow/Deny is considered within the full URL including GET parameters
* v1.3.0
    * add option to send cookies with tough-cookie https://www.npmjs.com/package/tough-cookie
    * Node version >= 15 may be required due to an issue with tough-cookie on Windows
* v1.2.0
    * code cleanup
    * added settings.json for application settings
    * add option to disable storing default data like links, statusCodes etc.
    * add option to save progress after every N pages crawled - this is then picked up automatically on next crawl from the same config file (by config.id)
    * creat output and save folders on app start - remove check on each save
    * added option for verbose output to console
* v1.1.0
    * fix pathnameAllow/Deny check
    * fix pattern check
    * fix typos in markup
    * add colors to console dump
    * add log for urls not crawled due to configuration
    * add crawl progress in percent

## Donate 
If you find this piece of code to be useful, please consider a donation :)

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/donate?hosted_button_id=ZPSPDRNU99V4Y)
