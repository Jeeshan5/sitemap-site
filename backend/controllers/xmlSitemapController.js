const Sitemap = require('../models/Sitemap');
const { startCrawl } = require('../utils/crawler');
const { buildXmlSitemap } = require('../utils/xmlBuilder');
const URL = require('url').URL;

/**
 * Handles the generation of an XML Sitemap for a given URL.
 */
exports.generateXmlSitemap = async (req, res, next) => {
    const { url } = req.body;
    const startTime = Date.now();

    if (!url) {
        return res.status(400).json({ error: 'Starting URL is required.' });
    }

    try {
        // 1. INPUT VALIDATION
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format provided.' });
        }

        // 2. CRAWLING
        // This returns a clean array of absolute URLs
        const urlsFound = await startCrawl(url);
        
        if (urlsFound.length === 0) {
            return res.status(404).json({ error: 'Could not crawl or find any internal links on the provided URL.' });
        }

        // 3. XML BUILDING
        const xmlString = buildXmlSitemap(urlsFound);
        const durationMs = Date.now() - startTime;

        // 4. DATABASE SAVE
        const newSitemap = new Sitemap({
            // Note: Replace 'test_user' with actual user ID later
            userId: 'test_user', 
            startUrl: url,
            type: 'xml',
            content: xmlString,
            urlsFound: urlsFound.map(loc => ({ loc })), // Simple structure for saving all URLs
            durationMs: durationMs,
            sizeBytes: Buffer.byteLength(xmlString, 'utf8')
        });

        const savedSitemap = await newSitemap.save();

        // 5. RESPONSE
        res.status(200).json({
            message: 'XML Sitemap generated and saved successfully.',
            sitemapId: savedSitemap._id,
            urlCount: urlsFound.length,
            duration: durationMs,
            xmlPreview: xmlString.substring(0, 500) + '...' // Send a small preview
        });

    } catch (error) {
        // Pass the error to the main error handler in server.js
        next(error);
    }
};


/**
 * Placeholder for downloading the XML file.
 * We will implement the actual file download logic later.
 */
exports.downloadXmlSitemap = (req, res) => {
    const { id } = req.params;
    // NOTE: In the future, fetch the sitemap from DB by ID and send it as a file.
    res.status(501).json({ 
        message: `Download functionality for Sitemap ID ${id} is not yet implemented.`,
        hint: 'Implement fetching from DB and res.download()'
    });
};
