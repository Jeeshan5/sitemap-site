const mongoose = require('mongoose');

// Define the structure for storing sitemap generation data
const SitemapSchema = new mongoose.Schema({
    // User ID or session identifier
    userId: {
        type: String,
        required: true,
        default: 'anonymous_user'
    },
    // The starting URL that was crawled
    startUrl: {
        type: String,
        required: true,
    },
    // The type of sitemap generated
    type: {
        type: String,
        required: true,
        enum: ['xml', 'html', 'visual']
    },
    // The final generated content
    content: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    // List of URLs found during the crawl
    urlsFound: [
        {
            loc: String,
            lastMod: Date,
            changeFreq: String,
            priority: Number,
            // NEW: Add category field for hierarchical organization
            category: {
                type: String,
                enum: ['page', 'blog', 'image', 'media', 'other'],
                default: 'page'
            }
        }
    ],
    // NEW: Statistics about the sitemap
    statistics: {
        pages: { type: Number, default: 0 },
        blogs: { type: Number, default: 0 },
        images: { type: Number, default: 0 },
        media: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },
    // Metadata for tracking
    createdAt: {
        type: Date,
        default: Date.now,
    },
    durationMs: {
        type: Number
    },
    sizeBytes: {
        type: Number
    }
});

module.exports = mongoose.model('Sitemap', SitemapSchema);