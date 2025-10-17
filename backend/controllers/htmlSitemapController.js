const Sitemap = require('../models/Sitemap'); 
const { startCrawl } = require('../utils/crawler');
const { buildHtmlSitemap } = require('../utils/htmlBuilder'); 
const URL = require('url').URL;

/**
 * Handles the generation of the HTML Sitemap.
 * This utilizes the crawler and the HTML builder utility.
 */
exports.generateHtmlSitemap = async (req, res, next) => {
    // Expects JSON body: { "url": "http://example.com" }
    const { url } = req.body; 
    const startTime = Date.now();

    if (!url) {
        return res.status(400).json({ error: 'Starting URL is required.' });
    }

    try {
        // 1. INPUT VALIDATION (Ensure it's a valid, absolute URL)
        let validUrl;
        try {
            validUrl = new URL(url).href;
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format provided. Must be absolute (e.g., https://example.com).' });
        }

        // 2. CRAWLING
        console.log(`Starting crawl for: ${validUrl}`);
        const urlsFound = await startCrawl(validUrl);
        
        if (urlsFound.length === 0) {
            return res.status(404).json({ error: 'Could not crawl or find any internal links on the provided URL.' });
        }

        // 3. HTML BUILDING (The completed logic)
        const htmlOutput = buildHtmlSitemap(urlsFound, validUrl); 
        const durationMs = Date.now() - startTime;
        const htmlSize = Buffer.byteLength(htmlOutput, 'utf8');


        // 4. DATABASE SAVE
        const newSitemap = new Sitemap({
            userId: 'test_user', // Placeholder - implement real auth later
            startUrl: validUrl,
            type: 'html',
            content: htmlOutput, // Saving the full HTML string
            urlsFound: urlsFound.map(loc => ({ loc })), 
            durationMs: durationMs,
            sizeBytes: htmlSize
        });

        const savedSitemap = await newSitemap.save();
        console.log(`HTML Sitemap saved with ID: ${savedSitemap._id}`);

        // 5. RESPONSE
        res.status(200).json({
            message: 'HTML Sitemap generated and saved successfully.',
            sitemapId: savedSitemap._id,
            urlCount: urlsFound.length,
            duration: durationMs,
            // Send a small preview to the frontend for display
            htmlPreview: htmlOutput.substring(0, 500) + '...' 
        });

    } catch (error) {
        console.error("Error in generateHtmlSitemap:", error.message);
        next(error);
    }
};

/**
 * Fetches and sends the HTML Sitemap directly as HTML content for display in an iframe or new window.
 */
exports.getHtmlSitemap = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sitemap = await Sitemap.findById(id);

        if (!sitemap) {
            return res.status(404).json({ error: "HTML Sitemap not found." });
        }

        // Set Content-Type header to ensure the browser renders it as HTML
        res.setHeader('Content-Type', 'text/html');
        res.send(sitemap.content);

    } catch (error) {
        next(error);
    }
};
