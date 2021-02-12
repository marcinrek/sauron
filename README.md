# Basic page crawler written in Node.js

Crawler is designed to work as a test tool. It can extract all links from a given site along with additional information like statusCode, page title etc. This can be then displayed on console or dumped to csv or json file.

## Example use cases
* check site for broken (404) links
* extract image urls from site
* crawl auction/ecommerce pages to calculate avarage prices
* extract all phone numbers from site

## Usage
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
    "requireValidSSLCert": false,
    "httpAuth": {
        "enable": false,
        "user":   "login",
        "pass":   "pass"
    },
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
| ```requireValidSSLCert```       | ```boolean```  | Check is SSL certificates valid   |
| ```httpAuth```       | ```object```  | Settings for basic authentication   |
| ```maxPages```      | ```number```  | Max pages to crawl. To have no limit set ```-1```   |
| ```stripGET```      | ```boolean```  | Strip GET parameters from links   |
| ```timeout```      | ```number```  | Single request timeout in ms   |

## Changelog
* v1.1.0
    * fix pathnameAllow/Deny check
    * fix pattern check
    * fix typos in markup
    * add colors to console dump
    * add log for urls not crawled due to configuration
    * add crawl progress in percent