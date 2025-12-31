# Plugins

Sauron supports an event-based plugin system that allows you to extend and modify the crawler's behavior without changing the core codebase. Plugins are loaded automatically from the `pluginsDirectory` specified in `sauron.settings.js`.

## Plugin Structure

Each plugin file must export an object with the following structure:

```javascript
module.exports = {
    name: 'Plugin Name',           // Optional: Display name for the plugin
    version: '1.0.0',              // Optional: Plugin version
    author: 'Author Name',         // Optional: Plugin author
    event: 'eventName',            // Required: The event name this plugin handles
    handler: async (data) => {     // Required: Async function that handles the event
        // Modify data as needed
        return data;               // Return modified data object
    }
};
```

## Available Events

### `beforeURLCrawled`

**Emitted:** Before a URL is crawled, allowing you to modify the URL before the HTTP request is made.

**Data Object:**
```javascript
{
    pageURL: string  // The URL that will be crawled
}
```

**Return Value:** Return an object with `pageURL` property to modify the URL:
```javascript
return { pageURL: modifiedURL };
```

**Example Use Cases:**
- URL filtering (return a different URL or skip crawling)
- URL normalization

**Example Plugin:**
```javascript
module.exports = {
    event: 'beforeURLCrawled',
    handler: async (data) => {
        // Force HTTPS for all URLs
        if (data.pageURL.startsWith('http://')) {
            data.pageURL = data.pageURL.replace('http://', 'https://');
        }
        return { pageURL: data.pageURL };
    }
};
```

---

### `afterURLCrawled`

**Emitted:** After the HTTP request is made but before the response is processed into page data. This event receives the raw HTTP response.

**Location:** `modules/crawling.js` - After `visitPage()` succeeds, before `buildPageData()`

**Data Object:**
```javascript
{
    crawlResult: {
        statusCode: number,      // HTTP status code
        headers: object,         // Response headers
        body: string,            // Response body (HTML content)
        raw: object              // Full axios response object
    },
    pageURL: string              // Page URL
}
```

**Return Value:** Return an object with `crawlResult` property to modify the response:
```javascript
return { crawlResult: modifiedCrawlResult };
```

**Example Use Cases:**
- Modify response body before parsing
- Extract or modify response headers
- Transform response data
- Add custom metadata to the response

**Example Plugin:**
```javascript
module.exports = {
    event: 'afterURLCrawled',
    handler: async (data) => {
        // Add prefix to the title in the HTML body
        let modifiedCrawlResult = structuredClone(data.crawlResult);
        
        const prefix = 'Site Name | ';
        modifiedCrawlResult.body = modifiedCrawlResult.body.replace(
            /<title>(.*?)<\/title>/i,
            (match, titleText) => `<title>${prefix}${titleText}</title>`
        );
        return { crawlResult: modifiedCrawlResult };
    }
};
```

---

### `onCrawlError`

**Emitted:** When an error occurs during the HTTP request (e.g., network error, timeout).

**Data Object:**
```javascript
{
    responseError: Error,  // The error object thrown
    pageURL: string        // The URL that failed to crawl
}
```

**Return Value:** This event is informational - you can return data but it won't affect error handling. The error will still be processed by the crawler.

**Example Use Cases:**
- Error logging and reporting
- Retry logic (though you'd need to handle this differently)
- Error transformation
- Notification systems

**Example Plugin:**
```javascript
module.exports = {
    event: 'onCrawlError',
    handler: async (data) => {
        console.error(`Failed to crawl ${data.pageURL}:`, data.responseError.message);
    }
};
```

---

### `afterPageDataCreated`

**Emitted:** After the page data object is built from the HTTP response. This is the processed page data that will be saved to output.

**Location:** `modules/crawling.js` - After `buildPageData()` is called

**Data Object:**
```javascript
{
    pageData: {
        id: number,              // Sequential crawl ID
        url: string,              // Page URL
        title: string,            // Page title (from <title> tag)
        status: number,           // HTTP status code
        links: string[],          // Array of URLs found on the page
        mailto: string[],        // Array of mailto: links
        tel: string[],           // Array of tel: links
        hash: string[],          // Array of hash (#) links
        error: boolean|string|number  // Error information if crawl failed
    }
}
```

**Return Value:** Return an object with `pageData` property to modify the page data:
```javascript
return { pageData: modifiedPageData };
```

**Example Use Cases:**
- Add custom fields to page data
- Filter or modify extracted links
- Transform page data structure
- Add metadata or computed values

**Example Plugin:**
```javascript
module.exports = {
    event: 'afterPageDataCreated',
    handler: async (data) => {
        // Filter out certain links
        data.pageData.links = data.pageData.links.filter(url => !url.includes('/admin/'));
        return { pageData: data.pageData };
    }
};
```

---

### `beforePagesToVisitUpdated`

**Emitted:** Before new URLs are added to the crawl queue. This allows you to filter or modify the list of URLs that will be crawled next.

**Data Object:**
```javascript
{
    pagesToVisitSet: set  // Set of URLs that will be added to the crawl queue
    pageURL: string    // page URL
}
```

**Return Value:** Return an object with `pagesToVisit` property (set of URLs) to modify the queue:
```javascript
return { pagesToVisit: modifiedPagesToVisit };
```

**Example Use Cases:**
- Filter URLs before adding to queue
- Add additional URLs to crawl

**Example Plugin:**
```javascript
module.exports = {
    event: 'beforePagesToVisitUpdated',
    handler: async (data) => {
        // Create a new Set to modify
        let modifiedSet = new Set(data.pagesToVisitSet);
        
        // Filter out URLs matching certain patterns
        for (const url of data.pagesToVisitSet) {
            if (url.includes('/api/') || url.includes('.pdf')) {
                modifiedSet.delete(url);
            }
        }
        
        // Add a custom URL
        modifiedSet.add('https://example.com/custom-page');
        
        return { pagesToVisit: modifiedSet };
    }
};
```

---

### `afterSitemapLinksExtracted`

**Emitted:** After URLs are extracted from a sitemap but before they are added to the crawl queue. This allows you to filter or modify the sitemap URLs.

**Data Object:**
```javascript
{
    sitemapData: string[]  // Array of URLs extracted from the sitemap
}
```

**Return Value:** Return an object with `sitemapData` property (array of URLs) to modify the sitemap URLs:
```javascript
return { sitemapData: modifiedSitemapData };
```

**Example Use Cases:**
- Filter URLs from sitemap before adding to queue
- Transform or normalize sitemap URLs
- Add additional URLs based on sitemap data
- Remove unwanted URLs from sitemap

**Example Plugin:**
```javascript
module.exports = {
    event: 'afterSitemapLinksExtracted',
    handler: async (data) => {
        // Filter out certain URLs from sitemap
        data.sitemapData = data.sitemapData.filter(url => {
            return !url.includes('/admin/') && !url.includes('.pdf');
        });
        return { sitemapData: data.sitemapData };
    }
};
```

---

### `afterSaveFileRead`

**Emitted:** After a save file is read and parsed, allowing you to modify the saved data before it's used to restore the crawl state.

**Data Object:**
```javascript
{
    savedData: {
        finished: boolean,           // Whether the crawl was finished
        counter: {
            limit: number,          // Maximum pages to crawl
            crawled: number         // Number of pages already crawled
        },
        startTimestamp: string,     // Timestamp when crawl started
        pagesToVisit: string[],     // Array of URLs to visit (converted from Set)
        discardedPages: string[],   // Array of discarded URLs (converted from Set)
        visitedPages: string[],     // Array of visited URLs (converted from Set)
        outputData: object,         // Output data object
        customData: array           // Custom data array
    }
}
```

**Return Value:** Return an object with `savedData` property to modify the saved data:
```javascript
return { savedData: modifiedSavedData };
```

**Example Use Cases:**
- Modify saved crawl state before resuming
- Filter or modify URLs in the saved state
- Update custom data before resuming
- Validate or sanitize saved data

**Example Plugin:**
```javascript
module.exports = {
    event: 'afterSaveFileRead',
    handler: async (data) => {
        // Filter out certain URLs from pagesToVisit
        data.savedData.pagesToVisit = data.savedData.pagesToVisit.filter(url => {
            return !url.includes('/old/');
        });
        return { savedData: data.savedData };
    }
};
```

---

### `beforeEachCrawlCycle`

**Emitted:** Before each crawl cycle begins, allowing you to modify the app data (including the crawl queue) before the next batch of URLs is crawled.

**Data Object:**
```javascript
{
    appData: {
        finished: boolean,              // Whether the crawl is finished
        counter: {
            limit: number,             // Maximum pages to crawl
            crawled: number            // Number of pages already crawled
        },
        startTimestamp: string,        // Timestamp when crawl started
        pagesToVisit: Set,             // Set of URLs to visit
        discardedPages: Set,           // Set of discarded URLs
        visitedPages: Set,             // Set of visited URLs
        outputData: object,            // Output data object
        customData: array,             // Custom data array
        saveRequired: boolean         // Whether save is required
    }
}
```

**Return Value:** Return an object with `appData` property to modify the app data:
```javascript
return { appData: modifiedAppData };
```

**Example Use Cases:**
- Modify crawl queue before each cycle
- Add or remove URLs from pagesToVisit
- Update custom data
- Implement custom crawl logic or prioritization

**Example Plugin:**
```javascript
module.exports = {
    event: 'beforeEachCrawlCycle',
    handler: async (data) => {
        // Add a priority URL to the front of the queue
        if (data.appData.pagesToVisit.size > 0) {
            data.appData.pagesToVisit.add('https://example.com/priority-page');
        }
        return { appData: data.appData };
    }
};
```

---

### `beforeSaveStatus`

**Emitted:** Before the crawl status is saved to disk, allowing you to modify the app data that will be saved.

**Data Object:**
```javascript
{
    appData: {
        finished: boolean,              // Whether the crawl is finished
        counter: {
            limit: number,             // Maximum pages to crawl
            crawled: number            // Number of pages already crawled
        },
        startTimestamp: string,        // Timestamp when crawl started
        pagesToVisit: Set,             // Set of URLs to visit
        discardedPages: Set,           // Set of discarded URLs
        visitedPages: Set,             // Set of visited URLs
        outputData: object,            // Output data object
        customData: array,             // Custom data array
        saveRequired: boolean         // Whether save is required
    }
}
```

**Return Value:** Return an object with `appData` property to modify the app data before saving:
```javascript
return { appData: modifiedAppData };
```

**Example Use Cases:**
- Clean up or modify data before saving
- Add metadata to customData before save
- Filter or modify URLs before save
- Update outputData before save

**Example Plugin:**
```javascript
module.exports = {
    event: 'beforeSaveStatus',
    handler: async (data) => {
        // Add metadata to customData before saving
        data.appData.customData.push({
            timestamp: new Date().toISOString(),
            crawledCount: data.appData.counter.crawled
        });
        return { appData: data.appData };
    }
};
```

---

## Plugin Directory

Plugins are automatically loaded from the directory specified in `sauron.settings.js`:

```javascript
module.exports = {
    pluginsDirectory: './plugins/',
    // ... other settings
};
```

## Plugin Loading

- All `.js` files in the plugins directory are loaded automatically
- Files with `.example.js` extension are ignored
- Invalid plugins (missing `event` or `handler`) are skipped with a warning
- Plugin errors are caught and logged without crashing the crawler
- Multiple plugins can handle the same event - they execute in parallel

## Best Practices

1. **Always return data:** Even if you don't modify it, return the data object to ensure proper flow
2. **Handle errors gracefully:** Wrap your plugin logic in try-catch if needed
3. **Use descriptive names:** Name your plugin files clearly (e.g., `filter-admin-urls.js`)
4. **Document your plugins:** Add comments explaining what your plugin does
5. **Test plugins:** Test your plugins with sample data before using in production
6. **Performance:** Keep plugin handlers fast - they run for every page crawled

