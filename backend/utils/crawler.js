const axios = require('axios');
const cheerio = require('cheerio');
const URL = require('url').URL;

// Set a common user agent to avoid being blocked by strict servers
const USER_AGENT = 'Mozilla/5.0 (compatible; SitemapBot/1.0)';
// Set a max depth to prevent endless crawling loops
const MAX_DEPTH = 3; 

/**
 * Normalizes a URL and returns only the base path (without query params or hash).
 * @param {string} url - The URL to normalize.
 * @returns {string} The normalized URL string.
 */
function normalizeUrl(url) {
    try {
        const parsedUrl = new URL(url);
        // Exclude query parameters and hash
        return parsedUrl.origin + parsedUrl.pathname.replace(/\/$/, '');
    } catch (e) {
        return null;
    }
}

/**
 * Recursive function to crawl a website and find all internal links.
 * @param {string} startUrl - The initial URL to begin crawling.
 * @param {number} currentDepth - The current recursion depth.
 * @param {Set<string>} visitedUrls - Set of URLs already visited (normalized).
 * @param {string} baseUrl - The base origin URL of the site.
 * @returns {Promise<Array<string>>} A list of unique, unnormalized internal URLs.
 */
async function crawl(startUrl, currentDepth, visitedUrls, baseUrl) {
    if (currentDepth > MAX_DEPTH) {
        return [];
    }

    const normalizedUrl = normalizeUrl(startUrl);
    if (!normalizedUrl || visitedUrls.has(normalizedUrl)) {
        return [];
    }
    
    // Add the normalized URL to the visited set immediately
    visitedUrls.add(normalizedUrl);
    let foundUrls = [startUrl]; 

    console.log(`[CRAWLER] Depth ${currentDepth}: Crawling ${normalizedUrl}`);

    try {
        const response = await axios.get(startUrl, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 5000 // 5 second timeout
        });
        
        if (response.status !== 200 || !response.headers['content-type']?.includes('text/html')) {
            return []; // Skip if not HTML or request failed
        }

        const $ = cheerio.load(response.data);
        const promises = [];

        $('a').each((i, link) => {
            let href = $(link).attr('href');
            
            if (!href) return;

            // Resolve relative URLs (e.g., /about) to absolute URLs
            let absoluteUrl;
            try {
                absoluteUrl = new URL(href, startUrl).href;
            } catch (e) {
                return; // Skip invalid URLs
            }

            const absoluteNormalized = normalizeUrl(absoluteUrl);
            if (!absoluteNormalized) return;

            // Check if URL is internal and not yet visited
            if (absoluteNormalized.startsWith(baseUrl) && !visitedUrls.has(absoluteNormalized)) {
                
                // Add the absolute, unnormalized URL to the found list
                foundUrls.push(absoluteUrl);
                
                // Recursively crawl the new link
                const nextCrawlPromise = crawl(absoluteUrl, currentDepth + 1, visitedUrls, baseUrl);
                promises.push(nextCrawlPromise);
            }
        });

        // Wait for all recursive crawls to complete
        const results = await Promise.all(promises);
        
        // Flatten the array of results
        return foundUrls.concat(...results);

    } catch (error) {
        console.error(`[CRAWLER] Error fetching ${normalizedUrl}: ${error.message}`);
        return [];
    }
}


/**
 * Main entry point for the crawling process.
 * @param {string} startUrl - The URL to start crawling.
 * @returns {Promise<Array<string>>} A list of unique, absolute URLs found.
 */
exports.startCrawl = async (startUrl) => {
    const startTime = Date.now();
    
    // Ensure the start URL is valid and determine the base URL (origin)
    let baseUrl;
    try {
        baseUrl = new URL(startUrl).origin;
    } catch (e) {
        throw new Error("Invalid starting URL provided.");
    }
    
    // Use a Set to track only normalized URLs that have been visited
    const visitedUrls = new Set();
    
    // Start the recursive crawl
    const rawUrls = await crawl(startUrl, 1, visitedUrls, baseUrl);
    
    // Final cleanup: remove duplicates from the raw array and filter out nulls
    const uniqueUrls = [...new Set(rawUrls)].filter(url => url !== null);
    
    const duration = Date.now() - startTime;
    console.log(`[CRAWLER] Crawl finished. Found ${uniqueUrls.length} URLs in ${duration}ms.`);

    return uniqueUrls;
};
