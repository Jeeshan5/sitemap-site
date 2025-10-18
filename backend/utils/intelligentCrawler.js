const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const URL = require('url').URL;
const { sanitizeUrls } = require('./urlValidator');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MAX_DEPTH = 2; // Reduced from 3 for faster crawling
const MAX_PAGES = 30; // Reduced from 50 for faster crawling

// Create custom axios instance with enhanced configuration
function createAxiosInstance() {
    return axios.create({
        httpsAgent: new https.Agent({
            rejectUnauthorized: true,
            secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT,
            minVersion: 'TLSv1',
            maxVersion: 'TLSv1.3'
        }),
        timeout: 30000, // Increased to 30 seconds
        maxRedirects: 5,
        headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        },
        validateStatus: (status) => status < 500 // Accept 4xx but not 5xx
    });
}

// Normalize URL to avoid duplicates
function normalizeUrl(url) {
    try {
        const parsedUrl = new URL(url);
        // Remove trailing slash and hash
        return parsedUrl.origin + parsedUrl.pathname.replace(/\/$/, '');
    } catch (e) {
        return null;
    }
}

// Error classification
function getErrorType(error) {
    if (error.code === 'EPROTO' || error.message.includes('SSL')) {
        return 'SSL_ERROR';
    }
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        return 'TIMEOUT';
    }
    if (error.code === 'ECONNREFUSED') {
        return 'CONNECTION_REFUSED';
    }
    if (error.code === 'ENOTFOUND') {
        return 'DNS_ERROR';
    }
    if (error.response) {
        return `HTTP_${error.response.status}`;
    }
    return 'UNKNOWN_ERROR';
}

// Determine if we should retry
function shouldNotRetry(error) {
    const noRetryErrors = [
        'ENOTFOUND', // DNS errors
        'ERR_INVALID_URL', // Invalid URL
    ];
    
    const noRetryStatuses = [400, 401, 403, 404, 410];
    
    if (noRetryErrors.includes(error.code)) {
        return true;
    }
    
    if (error.response && noRetryStatuses.includes(error.response.status)) {
        return true;
    }
    
    return false;
}

// Fetch with retry logic
async function fetchWithRetry(url, maxRetries = 2) {
    const axiosInstance = createAxiosInstance();
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[FETCH] Attempt ${attempt}/${maxRetries}: ${url}`);
            
            const startTime = Date.now();
            const response = await axiosInstance.get(url);
            const duration = Date.now() - startTime;
            
            if (response.status >= 400) {
                console.log(`[FETCH] Warning: Status ${response.status} for ${url}`);
            }
            
            console.log(`[FETCH] Success in ${duration}ms`);
            return response;
            
        } catch (error) {
            const errorType = getErrorType(error);
            console.log(`[FETCH] Attempt ${attempt} failed: ${errorType} - ${error.message}`);
            
            // Don't retry for certain error types
            if (shouldNotRetry(error)) {
                throw error;
            }
            
            // Wait before retrying (exponential backoff)
            if (attempt < maxRetries) {
                const delay = 2000 * Math.pow(2, attempt - 1);
                console.log(`[FETCH] Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error; // Last attempt failed
            }
        }
    }
}

// Add polite delay between requests
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main crawling function
async function safeCrawl(startUrl, currentDepth, visitedUrls, baseUrl) {
    // Stop conditions
    if (currentDepth > MAX_DEPTH || visitedUrls.size >= MAX_PAGES) {
        return [];
    }

    const normalizedUrl = normalizeUrl(startUrl);
    if (!normalizedUrl || visitedUrls.has(normalizedUrl)) {
        return [];
    }
    
    visitedUrls.add(normalizedUrl);
    let foundUrls = [startUrl];

    console.log(`[CRAWLER] Depth ${currentDepth}: Crawling ${normalizedUrl} (${visitedUrls.size}/${MAX_PAGES})`);

    try {
        // Use retry logic for fetching
        const response = await fetchWithRetry(startUrl);
        
        // Check if response is HTML
        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('text/html')) {
            console.log(`[CRAWLER] Skipping non-HTML content: ${contentType}`);
            return foundUrls;
        }

        // Parse HTML and extract links
        const $ = cheerio.load(response.data);
        const promises = [];
        const childUrls = [];

        $('a[href]').each((i, link) => {
            if (visitedUrls.size >= MAX_PAGES) return false; // Stop if limit reached
            
            let href = $(link).attr('href');
            if (!href) return;

            let absoluteUrl;
            try {
                absoluteUrl = new URL(href, startUrl).href;
            } catch (e) {
                return; // Skip invalid URLs
            }

            const absoluteNormalized = normalizeUrl(absoluteUrl);
            if (!absoluteNormalized) return;

            // Only crawl URLs from the same domain
            if (absoluteNormalized.startsWith(baseUrl) && !visitedUrls.has(absoluteNormalized)) {
                childUrls.push(absoluteUrl);
            }
        });

        // Add found URLs
        foundUrls.push(...childUrls);

        // Crawl child pages (limited to avoid overload)
        if (currentDepth < MAX_DEPTH) {
            const crawlLimit = Math.min(3, childUrls.length); // Max 3 children per page
            
            for (let i = 0; i < crawlLimit && visitedUrls.size < MAX_PAGES; i++) {
                const childUrl = childUrls[i];
                
                // Add polite delay between requests (1.5 seconds)
                await delay(1500);
                
                const childResults = await safeCrawl(
                    childUrl, 
                    currentDepth + 1, 
                    visitedUrls, 
                    baseUrl
                );
                foundUrls.push(...childResults);
            }
        }

        return foundUrls;

    } catch (error) {
        const errorType = getErrorType(error);
        console.error(`[CRAWLER] Error for ${startUrl}: ${errorType} - ${error.message}`);
        
        // Return what we have so far instead of completely failing
        // This allows partial results even if some pages fail
        return foundUrls;
    }
}

// Main export function
exports.startSafeCrawl = async (startUrl) => {
    const startTime = Date.now();
    
    let baseUrl;
    try {
        baseUrl = new URL(startUrl).origin;
    } catch (e) {
        throw new Error("Invalid starting URL provided.");
    }
    
    console.log(`[CRAWLER] Starting crawl for: ${baseUrl}`);
    console.log(`[CRAWLER] Max depth: ${MAX_DEPTH}, Max pages: ${MAX_PAGES}`);
    
    const visitedUrls = new Set();
    
    try {
        const rawUrls = await safeCrawl(startUrl, 1, visitedUrls, baseUrl);
        
        // Sanitize all extracted URLs
        const cleanUrls = sanitizeUrls(rawUrls);
        const uniqueUrls = [...new Set(cleanUrls)].filter(url => url !== null);
        
        const duration = Date.now() - startTime;
        console.log(`[CRAWLER] ✓ Completed: Found ${uniqueUrls.length} unique URLs in ${(duration/1000).toFixed(2)}s`);
        console.log(`[CRAWLER] Pages visited: ${visitedUrls.size}`);

        return uniqueUrls;
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[CRAWLER] ✗ Failed after ${(duration/1000).toFixed(2)}s: ${error.message}`);
        
        // If we have partial results, return them
        if (visitedUrls.size > 0) {
            console.log(`[CRAWLER] Returning partial results: ${visitedUrls.size} URLs`);
            const partialUrls = Array.from(visitedUrls);
            const cleanUrls = sanitizeUrls(partialUrls);
            return [...new Set(cleanUrls)].filter(url => url !== null);
        }
        
        // Re-throw if no results at all
        throw error;
    }
};

// Optional: Export individual functions for testing
module.exports = {
    startSafeCrawl: exports.startSafeCrawl,
    normalizeUrl,
    getErrorType
};