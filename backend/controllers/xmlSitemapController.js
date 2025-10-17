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
        // 1. INPUT VALIDATION (Ensure it's a valid, absolute URL)
        let validUrl;
        try {
            validUrl = new URL(url).href;
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format provided. Must be absolute (e.g., https://example.com).' });
        }

        // 2. CRAWLING
        console.log(`Starting XML crawl for: ${validUrl}`);
        const urlsFound = await startCrawl(validUrl);
        
        if (urlsFound.length === 0) {
            return res.status(404).json({ error: 'Could not crawl or find any internal links on the provided URL.' });
        }

        // 3. XML BUILDING
        const xmlString = buildXmlSitemap(urlsFound);
        const durationMs = Date.now() - startTime;
        const xmlSize = Buffer.byteLength(xmlString, 'utf8');

        // 4. DATABASE SAVE
        const newSitemap = new Sitemap({
            userId: 'test_user', 
            startUrl: validUrl,
            type: 'xml',
            content: xmlString,
            urlsFound: urlsFound.map(loc => ({ loc })),
            durationMs: durationMs,
            sizeBytes: xmlSize
        });

        const savedSitemap = await newSitemap.save();
        console.log(`XML Sitemap saved with ID: ${savedSitemap._id}`);

        // 5. RESPONSE
        res.status(200).json({
            message: 'XML Sitemap generated and saved successfully.',
            sitemapId: savedSitemap._id,
            urlCount: urlsFound.length,
            duration: durationMs,
            xmlPreview: xmlString.substring(0, 500) + '...' // Send a small preview
        });

    } catch (error) {
        console.error("Error in generateXmlSitemap:", error.message);
        next(error);
    }
};


/**
 * Fetches the saved XML Sitemap content by ID and sends it to the client as a downloadable file.
 */
exports.downloadXmlSitemap = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sitemap = await Sitemap.findById(id);

        if (!sitemap) {
            return res.status(404).json({ error: "XML Sitemap not found." });
        }
        
        // 1. Set headers for file download
        res.setHeader('Content-disposition', `attachment; filename=sitemap-${sitemap._id}.xml`);
        res.setHeader('Content-type', 'application/xml');

        // 2. Send the saved XML content
        res.send(sitemap.content);

    } catch (error) {
        console.error("Error in downloadXmlSitemap:", error.message);
        next(error);
    }
};
