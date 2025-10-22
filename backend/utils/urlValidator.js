const axios = require('axios');
const https = require('https');

/**
 * Check if a URL is safe to crawl
 */
async function validateUrl(url) {
    const issues = [];
    const warnings = [];
    let isSafe = true;

    try {
        const parsedUrl = new URL(url);

        // 1. Check protocol
        if (parsedUrl.protocol === 'http:') {
            warnings.push('Site uses HTTP (not HTTPS) - data is not encrypted');
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            issues.push('Invalid protocol. Only HTTP and HTTPS are supported');
            isSafe = false;
            return { isSafe, issues, warnings, canProceed: false };
        }

        // 2. Check if site is reachable and check SSL
        try {
            const agent = new https.Agent({
                rejectUnauthorized: true // Strict SSL checking
            });

            const response = await axios.head(url, {
                timeout: 10000,
                httpsAgent: agent,
                maxRedirects: 5,
                validateStatus: (status) => status < 500 // Accept redirects
            });

            // Site is reachable with valid SSL
            console.log(`✅ ${url} is safe to crawl`);

        } catch (error) {
            // Check what kind of error
            if (error.code === 'CERT_HAS_EXPIRED') {
                issues.push('SSL certificate has expired');
                isSafe = false;
            } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
                issues.push('SSL certificate cannot be verified');
                isSafe = false;
            } else if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
                issues.push('Site uses self-signed SSL certificate');
                isSafe = false;
            } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
                issues.push('SSL/TLS connection error - outdated security');
                isSafe = false;
            } else if (error.code === 'ECONNREFUSED') {
                issues.push('Connection refused - site may be down');
                isSafe = false;
            } else if (error.code === 'ENOTFOUND') {
                issues.push('Domain not found - check the URL');
                isSafe = false;
            } else if (error.code === 'ETIMEDOUT') {
                warnings.push('Site is slow to respond');
            } else {
                warnings.push(`Connection issue: ${error.message}`);
            }
        }

        // 3. REMOVED: robots.txt check
        // We no longer check robots.txt, allowing unrestricted crawling

    } catch (error) {
        issues.push('Invalid URL format');
        isSafe = false;
    }

    return {
        isSafe,
        issues,
        warnings,
        canProceed: isSafe && issues.length === 0
    };
}

/**
 * Sanitize extracted URLs
 */
function sanitizeUrls(urls) {
    return urls.filter(url => {
        try {
            const parsed = new URL(url);
            
            // Block dangerous protocols
            if (['javascript:', 'data:', 'file:', 'vbscript:'].includes(parsed.protocol)) {
                return false;
            }
            
            // Only allow http and https
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    });
}

module.exports = { validateUrl, sanitizeUrls };