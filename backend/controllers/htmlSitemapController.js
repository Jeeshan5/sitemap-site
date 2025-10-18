const { validateUrl } = require('../utils/urlValidator');
const { startSafeCrawl } = require('../utils/intelligentCrawler');
const { buildHtmlSitemap } = require('../utils/htmlBuilder');
const URL = require('url').URL;

exports.generateHtmlSitemap = async (req, res, next) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Starting URL is required.' });
    }

    try {
        // 1. Validate URL format
        let validUrl;
        try {
            validUrl = new URL(url).href;
        } catch (e) {
            return res.status(400).json({ 
                error: 'Invalid URL format.',
                suggestion: 'Please enter a valid URL (e.g., https://example.com)'
            });
        }

        // 2. Validate URL safety
        console.log(`Validating URL: ${validUrl}`);
        const validation = await validateUrl(validUrl);

        // 3. If not safe, return error with details
        if (!validation.canProceed) {
            return res.status(400).json({
                error: 'Cannot crawl this website safely',
                issues: validation.issues,
                warnings: validation.warnings,
                isSafe: validation.isSafe,
                message: 'This website has security issues. We cannot crawl it to protect your safety.'
            });
        }

        // 4. If there are warnings, include them in response
        if (validation.warnings.length > 0) {
            console.log('⚠️ Warnings:', validation.warnings);
        }

        // 5. Proceed with safe crawling
        console.log(`Starting safe crawl for: ${validUrl}`);
        const urlsFound = await startSafeCrawl(validUrl);
        
        if (urlsFound.length === 0) {
            return res.status(404).json({ 
                error: 'No URLs found.',
                suggestion: 'The site might have no internal links or uses JavaScript for navigation.'
            });
        }

        // 6. Build HTML
        const htmlOutput = buildHtmlSitemap(urlsFound, validUrl);

        // 7. Return response with warnings if any
        res.status(200).json({
            message: 'HTML Sitemap generated successfully.',
            html: htmlOutput,
            urlCount: urlsFound.length,
            warnings: validation.warnings.length > 0 ? validation.warnings : undefined
        });

    } catch (error) {
        console.error("Error in generateHtmlSitemap:", error.message);
        
        // Provide helpful error messages
        if (error.message.includes('SSL') || error.message.includes('certificate')) {
            return res.status(400).json({
                error: 'SSL Security Error',
                message: 'This website has SSL/TLS security issues. We cannot crawl it safely.',
                suggestion: 'Try a different website or contact the site owner to fix their SSL certificate.'
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to generate sitemap',
            message: error.message
        });
    }
};

exports.getHtmlSitemap = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // TODO: Implement your retrieval logic here
        // This could involve:
        // - Retrieving stored sitemap from database/cache using the id
        // - Getting the HTML sitemap data
        
        // Placeholder response for now:
        res.status(200).json({
            message: 'Get HTML sitemap - to be implemented',
            id: id,
            note: 'Implement your sitemap storage and retrieval logic here'
        });
        
    } catch (error) {
        console.error("Error in getHtmlSitemap:", error.message);
        res.status(500).json({ 
            error: 'Failed to get HTML sitemap',
            message: error.message
        });
    }
};