const axios = require('axios');
const https = require('https');
const dns = require('dns').promises;

/**
 * Validate and analyze a URL before crawling
 * Ignores robots.txt — full unrestricted crawl
 */
async function validateUrl(url) {
    const issues = [];
    const warnings = [];
    let isSafe = true;
    let finalUrl = url;
    let statusCode = null;
    let redirectChain = [];

    try {
        // Normalize missing protocol
        if (!/^https?:\/\//i.test(url)) {
            finalUrl = `https://${url}`;
            warnings.push('Protocol missing — assumed HTTPS');
        }

        const parsedUrl = new URL(finalUrl);

        // ✅ 1. Validate protocol
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            issues.push('Invalid protocol (only HTTP and HTTPS are supported)');
            return { isSafe: false, issues, warnings, canProceed: false };
        }

        if (parsedUrl.protocol === 'http:') {
            warnings.push('Site uses HTTP — not encrypted');
        }

        // ✅ 2. DNS lookup
        try {
            await dns.lookup(parsedUrl.hostname);
        } catch {
            issues.push('Domain not found (DNS lookup failed)');
            return { isSafe: false, issues, warnings, canProceed: false };
        }

        // ✅ 3. Test connectivity with strict SSL
        const agent = new https.Agent({ rejectUnauthorized: true });

        try {
            const response = await axios.head(finalUrl, {
                timeout: 10000,
                httpsAgent: agent,
                maxRedirects: 5,
                validateStatus: (status) => status < 500,
            });

            statusCode = response.status;
            redirectChain = response.request?.res?.responseUrl
                ? [url, response.request.res.responseUrl]
                : [];

            if (statusCode >= 400 && statusCode < 500) {
                warnings.push(`Site returned ${statusCode} — might block crawlers`);
            } else if (statusCode >= 500) {
                issues.push(`Server error ${statusCode}`);
                isSafe = false;
            }
        } catch (error) {
            // Handle SSL and network errors
            switch (error.code) {
                case 'CERT_HAS_EXPIRED':
                    issues.push('SSL certificate expired');
                    isSafe = false;
                    break;
                case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
                    issues.push('Unverified SSL certificate');
                    isSafe = false;
                    break;
                case 'SELF_SIGNED_CERT_IN_CHAIN':
                    issues.push('Self-signed SSL certificate');
                    isSafe = false;
                    break;
                case 'ECONNREFUSED':
                    issues.push('Connection refused — site may be offline');
                    isSafe = false;
                    break;
                case 'ENOTFOUND':
                    issues.push('Domain not found');
                    isSafe = false;
                    break;
                case 'ETIMEDOUT':
                    warnings.push('Connection timed out — site may be slow');
                    break;
                default:
                    if (error.response?.status === 429)
                        warnings.push('Rate limited (Too Many Requests)');
                    else if (error.message.includes('SSL') || error.message.includes('TLS'))
                        issues.push('SSL/TLS handshake error');
                    else warnings.push(`Connection issue: ${error.message}`);
            }
        }

        // 🚫 4. robots.txt check intentionally removed

    } catch (error) {
        issues.push('Invalid URL format');
        isSafe = false;
    }

    return {
        url: finalUrl,
        statusCode,
        redirectChain,
        isSafe,
        issues,
        warnings,
        canProceed: isSafe && issues.length === 0,
    };
}

/**
 * Sanitize a list of URLs — remove invalid or unsafe ones
 */
function sanitizeUrls(urls) {
    return urls
        .filter((url) => {
            try {
                const parsed = new URL(url);
                return ['http:', 'https:'].includes(parsed.protocol);
            } catch {
                return false;
            }
        })
        .filter(
            (url) =>
                !url.startsWith('javascript:') &&
                !url.startsWith('data:') &&
                !url.startsWith('file:')
        );
}

module.exports = { validateUrl, sanitizeUrls };
