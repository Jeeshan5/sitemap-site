/**
 * ============================================
 * ENHANCED SITEMAP MODEL
 * ============================================
 * 
 * This model stores comprehensive crawl data including:
 * - Page metadata (titles, descriptions, SEO data)
 * - Performance metrics (load times, status codes)
 * - Link relationships (internal/external links)
 * - Historical data (track changes over time)
 * - Screenshots (optional)
 */

const mongoose = require('mongoose');

// ============================================
// SUB-SCHEMAS FOR NESTED DATA
// ============================================

/**
 * Individual page/URL data with metadata
 */
const PageDataSchema = new mongoose.Schema({
    // URL information
    url: {
        type: String,
        required: true
    },
    normalizedUrl: {
        type: String,
        index: true
    },
    
    // Crawl metadata
    depth: {
        type: Number,
        default: 0
    },
    crawlMethod: {
        type: String,
        enum: ['axios', 'puppeteer', 'unknown'],
        default: 'unknown'
    },
    success: {
        type: Boolean,
        default: true
    },
    statusCode: {
        type: Number,
        default: 200
    },
    errorMessage: String,
    
    // Performance metrics
    loadTime: {
        type: Number, // milliseconds
        default: 0
    },
    pageSize: Number, // bytes
    
    // SEO Metadata
    metadata: {
        title: String,
        description: String,
        keywords: String,
        h1: String,
        canonical: String,
        ogImage: String,
        wordCount: Number,
        hasMetaDescription: Boolean,
        hasMetaKeywords: Boolean,
        hasH1: Boolean
    },
    
    // Link analysis
    internalLinks: [{
        type: String
    }],
    externalLinks: [{
        type: String
    }],
    brokenLinks: [{
        url: String,
        statusCode: Number
    }],
    
    // Screenshot (base64 or URL)
    screenshot: {
        type: String,
        select: false // Don't include by default (large data)
    },
    
    // Last crawled timestamp
    lastCrawled: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

/**
 * Crawl statistics and summary
 */
const CrawlStatsSchema = new mongoose.Schema({
    totalPages: {
        type: Number,
        default: 0
    },
    successfulPages: {
        type: Number,
        default: 0
    },
    failedPages: {
        type: Number,
        default: 0
    },
    averageLoadTime: {
        type: Number,
        default: 0
    },
    totalDuration: {
        type: Number, // milliseconds
        default: 0
    },
    
    // Method breakdown
    axiosCrawls: {
        type: Number,
        default: 0
    },
    puppeteerCrawls: {
        type: Number,
        default: 0
    },
    
    // SEO issues found
    pagesWithoutTitle: {
        type: Number,
        default: 0
    },
    pagesWithoutDescription: {
        type: Number,
        default: 0
    },
    brokenLinksCount: {
        type: Number,
        default: 0
    },
    
    // Depth analysis
    maxDepthReached: {
        type: Number,
        default: 0
    },
    pagesByDepth: {
        type: Map,
        of: Number
    }
}, { _id: false });

// ============================================
// MAIN SITEMAP SCHEMA
// ============================================

const SitemapSchema = new mongoose.Schema({
    // ==================
    // USER & PROJECT INFO
    // ==================
    userId: {
        type: String,
        required: true,
        default: 'anonymous_user',
        index: true
    },
    projectName: {
        type: String,
        default: 'Untitled Project'
    },
    
    // ==================
    // CRAWL CONFIGURATION
    // ==================
    startUrl: {
        type: String,
        required: true,
        index: true
    },
    baseUrl: {
        type: String,
        required: true
    },
    
    // Sitemap type
    type: {
        type: String,
        required: true,
        enum: ['xml', 'html', 'visual', 'json'],
        default: 'xml'
    },
    
    // Crawl settings used
    crawlSettings: {
        maxDepth: Number,
        maxPages: Number,
        puppeteerEnabled: {
            type: Boolean,
            default: true
        },
        screenshotsEnabled: {
            type: Boolean,
            default: false
        }
    },
    
    // ==================
    // GENERATED CONTENT
    // ==================
    content: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    
    // ==================
    // DETAILED PAGE DATA
    // ==================
    pages: [PageDataSchema],
    
    // ==================
    // STATISTICS & ANALYTICS
    // ==================
    stats: {
        type: CrawlStatsSchema,
        default: () => ({})
    },
    
    // ==================
    // METADATA & TRACKING
    // ==================
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    // File information
    sizeBytes: {
        type: Number,
        default: 0
    },
    compressionEnabled: {
        type: Boolean,
        default: false
    },
    
    // ==================
    // STATUS & HEALTH
    // ==================
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'partial'],
        default: 'completed'
    },
    errorLog: [{
        timestamp: Date,
        error: String,
        url: String
    }],
    
    // ==================
    // SCHEDULING & RE-CRAWL
    // ==================
    scheduledRecrawl: {
        enabled: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'never'],
            default: 'never'
        },
        nextCrawlDate: Date,
        lastCrawlDate: Date
    },
    
    // ==================
    // CHANGE DETECTION
    // ==================
    changeDetection: {
        enabled: {
            type: Boolean,
            default: false
        },
        lastContentHash: String, // Hash of all URLs
        changesDetected: [{
            date: Date,
            changeType: String, // 'new_page', 'removed_page', 'content_changed'
            url: String,
            details: String
        }]
    },
    
    // ==================
    // EXPORT & SHARING
    // ==================
    exports: [{
        format: {
            type: String,
            enum: ['xml', 'json', 'csv', 'pdf']
        },
        exportedAt: Date,
        downloadUrl: String,
        fileSize: Number
    }],
    
    isPublic: {
        type: Boolean,
        default: false
    },
    shareToken: {
        type: String,
        unique: true,
        sparse: true // Only if set
    }
});

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

SitemapSchema.index({ userId: 1, createdAt: -1 });
SitemapSchema.index({ startUrl: 1, createdAt: -1 });
SitemapSchema.index({ 'pages.url': 1 });
SitemapSchema.index({ status: 1 });
SitemapSchema.index({ shareToken: 1 });

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Update the updatedAt timestamp before saving
 */
SitemapSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

/**
 * Calculate statistics before saving
 */
SitemapSchema.pre('save', function(next) {
    if (this.pages && this.pages.length > 0) {
        const stats = {
            totalPages: this.pages.length,
            successfulPages: this.pages.filter(p => p.success).length,
            failedPages: this.pages.filter(p => !p.success).length,
            axiosCrawls: this.pages.filter(p => p.crawlMethod === 'axios').length,
            puppeteerCrawls: this.pages.filter(p => p.crawlMethod === 'puppeteer').length,
            pagesWithoutTitle: this.pages.filter(p => !p.metadata?.title).length,
            pagesWithoutDescription: this.pages.filter(p => !p.metadata?.description).length,
            brokenLinksCount: this.pages.reduce((sum, p) => sum + (p.brokenLinks?.length || 0), 0),
            maxDepthReached: Math.max(...this.pages.map(p => p.depth || 0)),
        };
        
        // Calculate average load time
        const loadTimes = this.pages.filter(p => p.loadTime > 0).map(p => p.loadTime);
        stats.averageLoadTime = loadTimes.length > 0 
            ? Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length)
            : 0;
        
        // Pages by depth
        const pagesByDepth = {};
        this.pages.forEach(page => {
            const depth = page.depth || 0;
            pagesByDepth[depth] = (pagesByDepth[depth] || 0) + 1;
        });
        stats.pagesByDepth = pagesByDepth;
        
        this.stats = stats;
    }
    next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Get summary statistics
 */
SitemapSchema.methods.getSummary = function() {
    return {
        id: this._id,
        projectName: this.projectName,
        startUrl: this.startUrl,
        type: this.type,
        status: this.status,
        stats: this.stats,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

/**
 * Get SEO issues report
 */
SitemapSchema.methods.getSEOReport = function() {
    const issues = [];
    
    this.pages.forEach(page => {
        if (!page.metadata?.title) {
            issues.push({
                type: 'missing_title',
                severity: 'high',
                url: page.url,
                message: 'Page is missing a title tag'
            });
        }
        
        if (!page.metadata?.description) {
            issues.push({
                type: 'missing_description',
                severity: 'medium',
                url: page.url,
                message: 'Page is missing a meta description'
            });
        }
        
        if (!page.metadata?.h1) {
            issues.push({
                type: 'missing_h1',
                severity: 'medium',
                url: page.url,
                message: 'Page is missing an H1 heading'
            });
        }
        
        if (page.brokenLinks && page.brokenLinks.length > 0) {
            issues.push({
                type: 'broken_links',
                severity: 'high',
                url: page.url,
                message: `Page has ${page.brokenLinks.length} broken links`,
                details: page.brokenLinks
            });
        }
    });
    
    return issues;
};

/**
 * Get performance report
 */
SitemapSchema.methods.getPerformanceReport = function() {
    const slowPages = this.pages
        .filter(p => p.loadTime > 3000)
        .sort((a, b) => b.loadTime - a.loadTime)
        .slice(0, 10);
    
    return {
        averageLoadTime: this.stats.averageLoadTime,
        slowestPages: slowPages.map(p => ({
            url: p.url,
            loadTime: p.loadTime,
            method: p.crawlMethod
        })),
        totalPages: this.stats.totalPages,
        totalDuration: this.stats.totalDuration
    };
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find all sitemaps for a user
 */
SitemapSchema.statics.findByUser = function(userId, limit = 10) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-pages.screenshot -content'); // Exclude large fields
};

/**
 * Find sitemap by share token
 */
SitemapSchema.statics.findByShareToken = function(token) {
    return this.findOne({ shareToken: token, isPublic: true });
};

/**
 * Get statistics across all sitemaps for a user
 */
SitemapSchema.statics.getUserStats = async function(userId) {
    const sitemaps = await this.find({ userId });
    
    return {
        totalSitemaps: sitemaps.length,
        totalPagesCrawled: sitemaps.reduce((sum, s) => sum + (s.stats?.totalPages || 0), 0),
        averageSuccessRate: sitemaps.length > 0
            ? sitemaps.reduce((sum, s) => {
                const total = s.stats?.totalPages || 1;
                const success = s.stats?.successfulPages || 0;
                return sum + (success / total);
            }, 0) / sitemaps.length * 100
            : 0,
        recentSitemaps: sitemaps.slice(0, 5).map(s => s.getSummary())
    };
};

// ============================================
// VIRTUAL PROPERTIES
// ============================================

/**
 * Success rate percentage
 */
SitemapSchema.virtual('successRate').get(function() {
    if (!this.stats || !this.stats.totalPages) return 0;
    return Math.round((this.stats.successfulPages / this.stats.totalPages) * 100);
});

/**
 * Has warnings or errors
 */
SitemapSchema.virtual('hasIssues').get(function() {
    return this.stats?.pagesWithoutTitle > 0 || 
           this.stats?.pagesWithoutDescription > 0 || 
           this.stats?.brokenLinksCount > 0;
});

// Ensure virtuals are included when converting to JSON
SitemapSchema.set('toJSON', { virtuals: true });
SitemapSchema.set('toObject', { virtuals: true });

// ============================================
// EXPORT MODEL
// ============================================

module.exports = mongoose.model('Sitemap', SitemapSchema);