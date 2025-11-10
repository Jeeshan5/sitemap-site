const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const URL = require('url').URL;
const { sanitizeUrls } = require('./urlValidator');
const { SSL_OP_LEGACY_SERVER_CONNECT } = require('constants');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MAX_DEPTH = 3;
const MAX_PAGES = 30;

// Create modern secure axios instance
function createSecureAxiosInstance() {
    return axios.create({
        httpsAgent: new https.Agent({
            rejectUnauthorized: true,          // Strict certificate checking
            minVersion: 'TLSv1.2',             // Secure minimum protocol
            maxVersion: 'TLSv1.3'
        }),
        timeout: 30000,
        maxRedirects: 5,
        headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
        },
        validateStatus: status => status < 500
    });
}

// Create legacy fallback axios instance (used only if secure attempt fails)
function createLegacyAxiosInstance() {
    return axios.create({
        httpsAgent: new https.Agent({
            rejectUnauthorized: false,             // Allow old/self-signed certs ONLY when necessary
            secureOptions: SSL_OP_LEGACY_SERVER_CONNECT,
            minVersion: 'TLSv1',                   // Enables TLS 1.0 compatibility
            maxVersion: 'TLSv1.3'
        }),
        timeout: 30000,
        maxRedirects: 5,
        headers: { 'User-Agent': USER_AGENT },
        validateStatus: status => status < 500
    });
}

// Error classification
function getErrorType(error) {
    if (error.code === 'EPROTO' || error.message.includes('SSL') || error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
        return 'SSL_ERROR';
    }
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        return 'TIMEOUT';
    }
    if (error.code === 'ECONNREFUSED') return 'CONNECTION_REFUSED';
    if (error.code === 'ENOTFOUND') return 'DNS_ERROR';
    if (error.response) return `HTTP_${error.response.status}`;
    return 'UNKNOWN_ERROR';
}

function shouldNotRetry(error) {
    const noRetryErrors = ['ENOTFOUND', 'ERR_INVALID_URL'];
    const noRetryStatuses = [400, 401, 403, 404, 410];
    if (noRetryErrors.includes(error.code)) return true;
    if (error.response && noRetryStatuses.includes(error.response.status)) return true;
    return false;
}

// Fetch with smart fallback logic
async function fetchWithRetry(url, maxRetries = 2) {
    const secureAxios = createSecureAxiosInstance();
    const legacyAxios = createLegacyAxiosInstance();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[FETCH] Secure attempt ${attempt}: ${url}`);
            return await secureAxios.get(url);

        } catch (error) {
            const errType = getErrorType(error);
            console.log(`[FETCH] Secure failed (${errType})`);

            if (errType === 'SSL_ERROR') {
                console.log(`[FETCH] Trying legacy TLS compatibility mode...`);
                try {
                    return await legacyAxios.get(url);
                } catch (legacyErr) {
                    console.log(`[FETCH] Legacy also failed.`);
                }
            }

            if (attempt < maxRetries && !shouldNotRetry(error)) {
                await new Promise(res => setTimeout(res, 1500 * attempt));
                continue;
            }

            throw error;
        }
    }
}

// Normalize URL
function normalizeUrl(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.origin + parsedUrl.pathname.replace(/\/$/, '');
    } catch {
        return null;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeCrawl(startUrl, currentDepth, visitedUrls, baseUrl) {
    if (currentDepth > MAX_DEPTH || visitedUrls.size >= MAX_PAGES) return [];

    const normalizedUrl = normalizeUrl(startUrl);
    if (!normalizedUrl || visitedUrls.has(normalizedUrl)) return [];

    visitedUrls.add(normalizedUrl);
    let foundUrls = [startUrl];

    console.log(`[CRAWLER] Depth ${currentDepth}: ${normalizedUrl} (${visitedUrls.size}/${MAX_PAGES})`);

    try {
        const response = await fetchWithRetry(startUrl);

        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('text/html')) return foundUrls;

        const $ = cheerio.load(response.data);
        const childUrls = [];

        $('a[href]').each((i, link) => {
            if (visitedUrls.size >= MAX_PAGES) return false;
            let href = $(link).attr('href');
            if (!href) return;

            let absoluteUrl;
            try { absoluteUrl = new URL(href, startUrl).href; } catch { return; }

            const absNorm = normalizeUrl(absoluteUrl);
            if (absNorm && absNorm.startsWith(baseUrl) && !visitedUrls.has(absNorm)) {
                childUrls.push(absoluteUrl);
            }
        });

        foundUrls.push(...childUrls);

        if (currentDepth < MAX_DEPTH) {
            const crawlLimit = Math.min(3, childUrls.length);
            for (let i = 0; i < crawlLimit && visitedUrls.size < MAX_PAGES; i++) {
                await delay(1500);
                const childResults = await safeCrawl(childUrls[i], currentDepth + 1, visitedUrls, baseUrl);
                foundUrls.push(...childResults);
            }
        }

        return foundUrls;

    } catch (error) {
        console.error(`[CRAWLER] Error: ${getErrorType(error)} - ${error.message}`);
        return foundUrls;
    }
}

exports.startSafeCrawl = async (startUrl) => {
    const startTime = Date.now();
    let baseUrl = new URL(startUrl).origin;

    console.log(`[CRAWLER] Starting crawl for: ${baseUrl}`);
    const visitedUrls = new Set();

    try {
        const rawUrls = await safeCrawl(startUrl, 1, visitedUrls, baseUrl);
        const cleanUrls = sanitizeUrls(rawUrls);
        const uniqueUrls = [...new Set(cleanUrls)].filter(url => url !== null);

        console.log(`[CRAWLER] ✓ Done: ${uniqueUrls.length} URLs found in ${(Date.now() - startTime)/1000}s`);
        return uniqueUrls;

    } catch (error) {
        console.error(`[CRAWLER] ✗ Failed: ${error.message}`);
        return [...visitedUrls];
    }
};

module.exports = {
    startSafeCrawl: exports.startSafeCrawl,
    normalizeUrl,
    getErrorType
};
