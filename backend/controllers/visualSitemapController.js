const Sitemap = require('../models/Sitemap');

/**
 * Handles the initial processing request for a visual sitemap.
 * This can be used to crawl a site and return data to the frontend,
 * or simply acknowledge the request if the frontend handles crawling.
 */
exports.processVisualSitemap = async (req, res, next) => {
    // NOTE: For simplicity, the frontend will handle the crawling/initial data structuring.
    // This endpoint acts as a simple validation/API check.
    const { url, depth } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Starting URL is required for processing.' });
    }
    
    // In a future version, you could call the crawler here, but for V1, 
    // we assume the frontend sends the final data structure to the 'save' endpoint.

    res.status(200).json({ 
        message: 'Visual Sitemap processing initiated. Ready for diagram creation.',
        // Mock data structure to show the frontend what to expect for saving
        initialData: {
            url,
            nodes: [{ id: '1', label: url, parent: null }],
            edges: []
        }
    });
};

/**
 * Saves the final, user-customized visual sitemap data (nodes/edges structure) 
 * sent from the frontend into the database.
 */
exports.saveVisualSitemap = async (req, res, next) => {
    // Expects JSON body containing the structured data (nodes, edges, etc.)
    const { startUrl, diagramData, userId } = req.body;

    if (!startUrl || !diagramData) {
        return res.status(400).json({ error: 'Missing start URL or diagram data.' });
    }

    try {
        // We stringify the complex diagram data (nodes/edges) before saving to ensure
        // it fits easily into the 'content' field as a JSON string.
        const contentString = JSON.stringify(diagramData);

        const newSitemap = new Sitemap({
            userId: userId || 'test_user',
            startUrl: startUrl,
            type: 'visual',
            content: contentString,
            urlsFound: [], // Not strictly necessary for visual, but good to have
            durationMs: 0,
            sizeBytes: Buffer.byteLength(contentString, 'utf8')
        });

        const savedSitemap = await newSitemap.save();

        res.status(201).json({
            message: 'Visual Sitemap saved successfully.',
            sitemapId: savedSitemap._id,
            url: savedSitemap.startUrl
        });

    } catch (error) {
        console.error("Error saving visual sitemap:", error.message);
        // MongoDB Schema validation errors (if any) will be caught here
        next(error); 
    }
};
