// NOTE: We still need to create htmlBuilder.js in utils/
const Sitemap = require('../models/Sitemap'); 
const { startCrawl } = require('../utils/crawler');

/**
 * Handles the generation of the HTML Sitemap.
 * This is similar to XML, but the utils will generate nested HTML structure.
 */
exports.generateHtmlSitemap = async (req, res, next) => {
    const { url } = req.body;
    const startTime = Date.now();

    if (!url) {
        return res.status(400).json({ error: 'Starting URL is required.' });
    }

    try {
        // 1. CRAWLING
        const urlsFound = await startCrawl(url);
        
        // 2. HTML BUILDING (Requires a separate htmlBuilder utility)
        // const htmlOutput = buildHtmlSitemap(urlsFound); 

        // 3. (MOCK RESPONSE until htmlBuilder is created)
        const durationMs = Date.now() - startTime;

        res.status(200).json({
            message: 'HTML Sitemap generation initiated. Crawler finished.',
            urlCount: urlsFound.length,
            duration: durationMs,
            // Mock content
            htmlPreview: '<h1>HTML Structure will go here...</h1>' 
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Fetches and displays a specific saved HTML Sitemap.
 */
exports.getHtmlSitemap = async (req, res) => {
    const { id } = req.params;
    // NOTE: In the future, fetch the sitemap content from DB by ID and render it.
    res.status(501).json({ 
        message: `Fetching HTML Sitemap ID ${id} is not yet implemented.`,
        hint: 'Implement fetching from DB and sending HTML content.'
    });
};
