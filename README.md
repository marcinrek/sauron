# Basic page crawler written in Node.js

Crawler is designed to work as a test tool. It can extract all links from a given site along with additional information like statusCode, page title etc. This can be then displayed on console or dumped to csv or json file.

## Example use cases
* check site for broken (404) links
* extract image urls from site
* crawl auction/ecommerce pages to calculate avarage prices
* extract all phone numbers from site

## Usage
Starting from version 1.3.0 Node version >= 15 may be required.

* crawl based on a config file
```
node .\sauron.js .\sample.config.json 
```
* same as above but start with a list of urls 
```
node .\sauron.js .\configs\sample.config.json .\configs\list.input.json
```
* launch test server (http://127.0.0.1) from /demo folder
```
npm run serve:demo
```
## Config file example
```
{
    "id":             "projectId",
    "startURL":       "http://example.com",
    "output":         "csv",
    "custom": {
        "useCustom": true,
        "customFile": "./custom/custom.blank"
    },
    "allowedDomains": [
        "example.com",
        "test.example.com"
    ],
    "allowedProtocols": [
        "http:",
        "https:"
    ],
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
    "cookieURL": null,
    "cookies": [],
    "requireValidSSLCert": false,
    "storeDefaultData": true,
    "saveStatusEach": 1000,
    "verbose": false,
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
| ```custom```      | ```object```  | Custom parsing actions settings        |
| ```allowedDomains```        | ```array```  | Only domains from this array will be crawled. Empty array will discard this check.               |
| ```allowedProtocoles```       | ```array```  | Page protocols to crawl. Allowed values: ```http```, ```https```. Empty array will discard this check.   |
| ```allowLinksFrom```       | ```object```  | Only links that are found on a urls that matche given requirements will be crawled.   |
| ```crawlLinks```       | ```object```  | Only links that matche given requirements will be crawled. Example patter to exclude "/files/" path and PDF files ```^(.(?!.*\\/files\\/|.*\\.pdf$))*```   |
| ```saveCrawlData```       | ```object```  | Only links that matche given requirements will be saved to output.   |
| ```httpAuth```       | ```object```  | Settings for basic authentication   |
| ```cookieURL```       | ```string```  | URL for the cookie   |
| ```cookies```       | ```array```  | Each cookie is a JSON entry; docs: https://www.npmjs.com/package/tough-cookie   |
| ```requireValidSSLCert```       | ```boolean```  | Check is SSL certificates valid   |
| ```storeDefaultData```      | ```boolean```  | Store default data with links, statusCodes etc   |
| ```saveStatusEach```      | ```number```  | Save status each N crawls to enable abort and continue later   |
| ```verbose```      | ```boolean```  | Print more output to console   |
| ```maxPages```      | ```number```  | Max pages to crawl. To have no limit set ```-1```   |
| ```stripGET```      | ```boolean```  | Strip GET parameters from links   |
| ```timeout```      | ```number```  | Single request timeout in ms   |

## Changelog
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
If you found this piece of code useful in anyway please consider a donation :)

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/donate?hosted_button_id=ZPSPDRNU99V4Y)
