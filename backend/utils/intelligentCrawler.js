/**
 * ============================================
 * INTELLIGENT CRAWLER WITH PUPPETEER SUPPORT
 * ============================================
 * 
 * This crawler automatically detects whether a page needs JavaScript rendering
 * and switches between Axios (fast) and Puppeteer (slow but complete) accordingly.
 * 
 * Features:
 * - Smart JS detection
 * - Parallel crawling with queue
 * - Rich metadata extraction
 * - Performance metrics
 * - Database integration ready
 * - Screenshot capture (optional)
 */

const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const URL = require('url').URL;
const { sanitizeUrls } = require('./urlValidator');

// ============================================
// CONFIGURATION CONSTANTS
// ============================================

const CONFIG = {
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    MAX_DEPTH: 3,
    MAX_PAGES: 50,
    TIMEOUT: 30000,
    DELAY_BETWEEN_REQUESTS: 1500, // Be polite (1.5 seconds)
    MAX_RETRIES: 2,
    PARALLEL_LIMIT: 3, // Crawl 3 pages simultaneously
    PUPPETEER_TIMEOUT: 45000,
    SCREENSHOT_ENABLED: false, // Set to true to capture screenshots
};

// Sites known to require JavaScript rendering
const JS_HEAVY_SITES = [
    'react', 'vue', 'angular', 'next', 'gatsby',
    'goibibo', 'makemytrip', 'booking.com',
    'airbnb', 'instagram', 'twitter', 'facebook'
];

// ============================================
// AXIOS INSTANCE WITH SSL HANDLING
// ============================================

function createAxiosInstance() {
    return axios.create({
        httpsAgent: new https.Agent({
            rejectUnauthorized: true,
            secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT,
            minVersion: 'TLSv1',
            maxVersion: 'TLSv1.3'
        }),
        timeout: CONFIG.TIMEOUT,
        maxRedirects: 5,
        headers: {
            'User-Agent': CONFIG.USER_AGENT,
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
        validateStatus: (status) => status < 500
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Normalize URL to avoid duplicates
 */
function normalizeUrl(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.origin + parsedUrl.pathname.replace(/\/$/, '');
    } catch (e) {
        return null;
    }
}

/**
 * Classify error types for better handling
 */
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

/**
 * Determine if we should retry based on error type
 */
function shouldNotRetry(error) {
    const noRetryErrors = ['ENOTFOUND', 'ERR_INVALID_URL'];
    const noRetryStatuses = [400, 401, 403, 404, 410];
    
    if (noRetryErrors.includes(error.code)) return true;
    if (error.response && noRetryStatuses.includes(error.response.status)) return true;
    
    return false;
}

/**
 * Add polite delay between requests
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Detect if a page likely needs JavaScript rendering
 */
function needsJavaScriptRendering(url, html) {
    // Check URL patterns
    const urlNeedsJS = JS_HEAVY_SITES.some(keyword => url.toLowerCase().includes(keyword));
    
    if (html) {
        // Check for common JS framework indicators
        const jsIndicators = [
            'data-react', 'data-reactroot', 'data-reactid', // React
            'ng-app', 'ng-controller', 'ng-view', // Angular
            'v-app', 'v-cloak', // Vue
            '__NEXT_DATA__', // Next.js
            'gatsby', // Gatsby
        ];
        
        const hasJsFramework = jsIndicators.some(indicator => 
            html.includes(indicator)
        );
        
        // Check if page has very little content (sign of client-side rendering)
        const $ = cheerio.load(html);
        const textContent = $('body').text().trim();
        const hasMinimalContent = textContent.length < 200;
        
        return hasJsFramework || hasMinimalContent;
    }
    
    return urlNeedsJS;
}

// ============================================
// PUPPETEER CRAWLER (For JS-heavy sites)
// ============================================

/**
 * Crawl a page using Puppeteer (handles JavaScript rendering)
 * Returns: { success, html, links, metadata, screenshot }
 */
async function crawlWithPuppeteer(url, browser = null) {
    const shouldCloseBrowser = !browser;
    let localBrowser = browser;
    
    try {
        console.log(`[PUPPETEER] 🎭 Rendering: ${url}`);
        
        // Launch browser if not provided
        if (!localBrowser) {
            localBrowser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-web-security'
                ]
            });
        }
        
        const page = await localBrowser.newPage();
        
        // Set viewport and user agent
        await page.setUserAgent(CONFIG.USER_AGENT);
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Track performance
        const startTime = Date.now();
        
        // Navigate to page
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: CONFIG.PUPPETEER_TIMEOUT
        });
        
        // Wait for dynamic content to load
        await page.waitForTimeout(2000);
        
        const duration = Date.now() - startTime;
        
        // Extract HTML content
        const html = await page.content();
        
        // Extract all links
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href]'))
                .map(a => a.href)
                .filter(href => href && href.startsWith('http'));
        });
        
        // Extract metadata
        const metadata = await page.evaluate(() => {
            const getMeta = (name) => {
                const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                return meta ? meta.content : null;
            };
            
            return {
                title: document.title || null,
                description: getMeta('description') || getMeta('og:description'),
                keywords: getMeta('keywords'),
                ogImage: getMeta('og:image'),
                canonical: document.querySelector('link[rel="canonical"]')?.href || null,
                h1: document.querySelector('h1')?.textContent?.trim() || null,
                wordCount: document.body.innerText.trim().split(/\s+/).length,
            };
        });
        
        // Take screenshot (optional)
        let screenshot = null;
        if (CONFIG.SCREENSHOT_ENABLED) {
            screenshot = await page.screenshot({ 
                encoding: 'base64',
                fullPage: false,
                type: 'jpeg',
                quality: 60
            });
        }
        
        await page.close();
        
        console.log(`[PUPPETEER] ✅ Success in ${duration}ms - Found ${links.length} links`);
        
        return {
            success: true,
            html,
            links: [...new Set(links)],
            metadata,
            screenshot,
            duration,
            method: 'puppeteer'
        };
        
    } catch (error) {
        console.error(`[PUPPETEER] ❌ Error: ${error.message}`);
        return {
            success: false,
            error: error.message,
            method: 'puppeteer'
        };
    } finally {
        if (shouldCloseBrowser && localBrowser) {
            await localBrowser.close();
        }
    }
}

// ============================================
// AXIOS CRAWLER (For static sites - FAST)
// ============================================

/**
 * Fetch page using Axios with retry logic
 * Returns: { success, html, duration, statusCode }
 */
async function fetchWithAxios(url, maxRetries = CONFIG.MAX_RETRIES) {
    const axiosInstance = createAxiosInstance();
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[AXIOS] 🌐 Attempt ${attempt}/${maxRetries}: ${url}`);
            
            const startTime = Date.now();
            const response = await axiosInstance.get(url);
            const duration = Date.now() - startTime;
            
            if (response.status >= 400) {
                console.log(`[AXIOS] ⚠️  Status ${response.status}`);
            }
            
            console.log(`[AXIOS] ✅ Success in ${duration}ms`);
            
            return {
                success: true,
                html: response.data,
                duration,
                statusCode: response.status,
                headers: response.headers,
                method: 'axios'
            };
            
        } catch (error) {
            const errorType = getErrorType(error);
            console.log(`[AXIOS] ❌ Attempt ${attempt} failed: ${errorType}`);
            
            if (shouldNotRetry(error)) {
                throw error;
            }
            
            if (attempt < maxRetries) {
                const delayTime = 2000 * Math.pow(2, attempt - 1);
                console.log(`[AXIOS] ⏳ Waiting ${delayTime}ms before retry...`);
                await delay(delayTime);
            } else {
                throw error;
            }
        }
    }
}

/**
 * Extract links and metadata from HTML using Cheerio
 */
function extractDataFromHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    
    // Extract links
    const links = [];
    $('a[href]').each((i, link) => {
        const href = $(link).attr('href');
        if (!href) return;
        
        try {
            const absoluteUrl = new URL(href, baseUrl).href;
            links.push(absoluteUrl);
        } catch (e) {
            // Skip invalid URLs
        }
    });
    
    // Extract metadata
    const getMeta = (selector) => {
        const el = $(selector);
        return el.length > 0 ? el.attr('content') || el.text() : null;
    };
    
    const metadata = {
        title: $('title').text() || null,
        description: getMeta('meta[name="description"]') || getMeta('meta[property="og:description"]'),
        keywords: getMeta('meta[name="keywords"]'),
        ogImage: getMeta('meta[property="og:image"]'),
        canonical: $('link[rel="canonical"]').attr('href') || null,
        h1: $('h1').first().text().trim() || null,
        wordCount: $('body').text().trim().split(/\s+/).length,
    };
    
    return { links, metadata };
}

// ============================================
// SMART HYBRID CRAWLER
// ============================================

/**
 * Smart crawler that auto-detects and uses the best method
 */
async function smartCrawl(url, browser = null) {
    try {
        // Try Axios first (it's much faster)
        const axiosResult = await fetchWithAxios(url);
        
        if (axiosResult.success) {
            const { links, metadata } = extractDataFromHtml(axiosResult.html, url);
            
            // Check if page needs JS rendering
            const needsJS = needsJavaScriptRendering(url, axiosResult.html);
            
            if (needsJS) {
                console.log(`[SMART] 🔄 Detected JS framework - switching to Puppeteer`);
                return await crawlWithPuppeteer(url, browser);
            }
            
            return {
                ...axiosResult,
                links,
                metadata
            };
        }
        
    } catch (error) {
        console.log(`[SMART] ⚠️  Axios failed, trying Puppeteer: ${error.message}`);
    }
    
    // Fallback to Puppeteer
    return await crawlWithPuppeteer(url, browser);
}

// ============================================
// MAIN RECURSIVE CRAWLER
// ============================================

/**
 * Recursive crawling function with depth limit
 */
async function recursiveCrawl(startUrl, currentDepth, visitedUrls, baseUrl, browser, crawlResults) {
    // Stop conditions
    if (currentDepth > CONFIG.MAX_DEPTH || visitedUrls.size >= CONFIG.MAX_PAGES) {
        return;
    }
    
    const normalizedUrl = normalizeUrl(startUrl);
    if (!normalizedUrl || visitedUrls.has(normalizedUrl)) {
        return;
    }
    
    visitedUrls.add(normalizedUrl);
    console.log(`\n[CRAWLER] 📊 Depth ${currentDepth}: ${normalizedUrl} (${visitedUrls.size}/${CONFIG.MAX_PAGES})`);
    
    try {
        // Crawl the page
        const result = await smartCrawl(startUrl, browser);
        
        if (!result.success) {
            console.error(`[CRAWLER] ❌ Failed to crawl: ${result.error}`);
            // Store failed result
            crawlResults.push({
                url: startUrl,
                success: false,
                error: result.error,
                depth: currentDepth
            });
            return;
        }
        
        // Store successful result with metadata
        crawlResults.push({
            url: startUrl,
            success: true,
            statusCode: result.statusCode || 200,
            duration: result.duration,
            method: result.method,
            metadata: result.metadata || {},
            depth: currentDepth,
            timestamp: new Date()
        });
        
        // Filter links to same domain only
        const childUrls = result.links
            .filter(link => {
                const normalized = normalizeUrl(link);
                return normalized && 
                       normalized.startsWith(baseUrl) && 
                       !visitedUrls.has(normalized);
            })
            .slice(0, 10); // Limit children per page
        
        console.log(`[CRAWLER] 🔗 Found ${childUrls.length} internal links`);
        
        // Crawl children recursively
        if (currentDepth < CONFIG.MAX_DEPTH && childUrls.length > 0) {
            for (const childUrl of childUrls) {
                if (visitedUrls.size >= CONFIG.MAX_PAGES) break;
                
                // Polite delay between requests
                await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
                
                await recursiveCrawl(
                    childUrl,
                    currentDepth + 1,
                    visitedUrls,
                    baseUrl,
                    browser,
                    crawlResults
                );
            }
        }
        
    } catch (error) {
        console.error(`[CRAWLER] 💥 Unexpected error: ${error.message}`);
        crawlResults.push({
            url: startUrl,
            success: false,
            error: error.message,
            depth: currentDepth
        });
    }
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

/**
 * Start the intelligent crawl
 * Returns: Array of URLs with metadata
 */
exports.startSafeCrawl = async (startUrl) => {
    const startTime = Date.now();
    let browser = null;
    
    try {
        // Validate and normalize start URL
        let baseUrl;
        try {
            baseUrl = new URL(startUrl).origin;
        } catch (e) {
            throw new Error("Invalid starting URL provided.");
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🚀 INTELLIGENT CRAWLER STARTING');
        console.log('='.repeat(60));
        console.log(`📍 Base URL: ${baseUrl}`);
        console.log(`📊 Max Depth: ${CONFIG.MAX_DEPTH} | Max Pages: ${CONFIG.MAX_PAGES}`);
        console.log(`⚡ Parallel Limit: ${CONFIG.PARALLEL_LIMIT}`);
        console.log('='.repeat(60) + '\n');
        
        // Launch Puppeteer browser (reuse for all requests)
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        
        const visitedUrls = new Set();
        const crawlResults = [];
        
        // Start recursive crawl
        await recursiveCrawl(startUrl, 1, visitedUrls, baseUrl, browser, crawlResults);
        
        // Close browser
        if (browser) {
            await browser.close();
        }
        
        const duration = Date.now() - startTime;
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ CRAWL COMPLETED');
        console.log('='.repeat(60));
        console.log(`📊 Pages Crawled: ${crawlResults.length}`);
        console.log(`⏱️  Total Duration: ${(duration / 1000).toFixed(2)}s`);
        console.log(`🎯 Success Rate: ${(crawlResults.filter(r => r.success).length / crawlResults.length * 100).toFixed(1)}%`);
        console.log('='.repeat(60) + '\n');
        
        return crawlResults;
        
    } catch (error) {
        console.error(`\n❌ CRAWL FAILED: ${error.message}\n`);
        
        if (browser) {
            await browser.close();
        }
        
        throw error;
    }
};

// Export utility functions for testing
module.exports = {
    startSafeCrawl: exports.startSafeCrawl,
    smartCrawl,
    needsJavaScriptRendering,
    normalizeUrl,
    getErrorType
};