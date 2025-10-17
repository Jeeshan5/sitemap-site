const mongoose = require('mongoose');

// Define the structure for storing sitemap generation data
const SitemapSchema = new mongoose.Schema({
    // User ID or session identifier (for linking to the user later)
    userId: {
        type: String,
        required: true,
        default: 'anonymous_user' // Placeholder until user authentication is added
    },
    // The starting URL that was crawled
    startUrl: {
        type: String,
        required: true,
    },
    // The type of sitemap generated (e.g., 'xml', 'html', 'visual')
    type: {
        type: String,
        required: true,
        enum: ['xml', 'html', 'visual']
    },
    // The final generated content (e.g., the XML string, or structured HTML data)
    content: {
        type: mongoose.Schema.Types.Mixed, // Allows flexible data types (string for XML, object for visual)
        required: true
    },
    // List of URLs found during the crawl (for statistics and reference)
    urlsFound: [
        {
            loc: String,
            lastMod: Date,
            changeFreq: String,
            priority: Number
        }
    ],
    // Metadata for tracking
    createdAt: {
        type: Date,
        default: Date.now,
    },
    durationMs: { // How long the crawling/generation process took
        type: Number
    },
    sizeBytes: { // Size of the final output
        type: Number
    }
});

module.exports = mongoose.model('Sitemap', SitemapSchema);
