/**
 * ============================================
 * ENHANCED SITEMAP CONTROLLER WITH DB STORAGE
 * ============================================
 * 
 * This controller:
 * - Uses the enhanced intelligent crawler
 * - Stores comprehensive data in MongoDB
 * - Provides detailed analytics
 * - Supports retrieval and history
 */

const { validateUrl } = require('../utils/urlValidator');
const { startSafeCrawl } = require('../utils/intelligentCrawler');
const { buildHtmlSitemap } = require('../utils/htmlBuilder');
const Sitemap = require('../models/Sitemap');
const URL = require('url').URL;

// ============================================
// GENERATE HTML SITEMAP (WITH DATABASE STORAGE)
// ============================================

/**
 * Generate HTML sitemap and store detailed crawl data
 * POST /api/sitemap/html
 */
exports.generateHtmlSitemap = async (req, res, next) => {
    const { url, projectName, userId = 'anonymous_user', saveToDb = true } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Starting URL is required.' });
    }

    const startTime = Date.now();
    let crawlResults = [];

    try {
        // ==================
        // 1. VALIDATE URL FORMAT
        // ==================
        let validUrl;
        try {
            validUrl = new URL(url).href;
        } catch (e) {
            return res.status(400).json({ 
                error: 'Invalid URL format.',
                suggestion: 'Please enter a valid URL (e.g., https://example.com)'
            });
        }

        // ==================
        // 2. VALIDATE URL SAFETY
        // ==================
        console.log(`[CONTROLLER] 🔍 Validating URL: ${validUrl}`);
        const validation = await validateUrl(validUrl);

        if (!validation.canProceed) {
            return res.status(400).json({
                error: 'Cannot crawl this website safely',
                issues: validation.issues,
                warnings: validation.warnings,
                isSafe: validation.isSafe,
                message: 'This website has security issues. We cannot crawl it to protect your safety.'
            });
        }

        if (validation.warnings.length > 0) {
            console.log('[CONTROLLER] ⚠️  Warnings:', validation.warnings);
        }

        // ==================
        // 3. START INTELLIGENT CRAWL
        // ==================
        console.log(`[CONTROLLER] 🚀 Starting intelligent crawl for: ${validUrl}`);
        
        // This now returns array of page objects with metadata
        crawlResults = await startSafeCrawl(validUrl);
        
        if (!crawlResults || crawlResults.length === 0) {
            return res.status(404).json({ 
                error: 'No URLs found.',
                suggestion: 'The site might have no internal links or uses JavaScript for navigation.'
            });
        }

        // ==================
        // 4. PROCESS RESULTS
        // ==================
        
        // Extract just URLs for HTML generation
        const urlsList = crawlResults
            .filter(result => result.success)
            .map(result => result.url);
        
        // Build HTML sitemap
        const htmlOutput = buildHtmlSitemap(urlsList, validUrl);
        
        // Calculate total duration
        const totalDuration = Date.now() - startTime;
        
        // ==================
        // 5. PREPARE DATABASE DOCUMENT
        // ==================
        
        const baseUrl = new URL(validUrl).origin;
        
        // Transform crawl results into page data for database
        const pagesData = crawlResults.map(result => ({
            url: result.url,
            normalizedUrl: result.url,
            depth: result.depth || 0,
            crawlMethod: result.method || 'unknown',
            success: result.success,
            statusCode: result.statusCode || (result.success ? 200 : 500),
            errorMessage: result.error || null,
            loadTime: result.duration || 0,
            metadata: {
                title: result.metadata?.title || null,
                description: result.metadata?.description || null,
                keywords: result.metadata?.keywords || null,
                h1: result.metadata?.h1 || null,
                canonical: result.metadata?.canonical || null,
                ogImage: result.metadata?.ogImage || null,
                wordCount: result.metadata?.wordCount || 0,
                hasMetaDescription: !!result.metadata?.description,
                hasMetaKeywords: !!result.metadata?.keywords,
                hasH1: !!result.metadata?.h1
            },
            lastCrawled: result.timestamp || new Date()
        }));
        
        // ==================
        // 6. SAVE TO DATABASE (OPTIONAL)
        // ==================
        
        let savedSitemap = null;
        
        if (saveToDb) {
            console.log('[CONTROLLER] 💾 Saving to database...');
            
            const sitemapDocument = new Sitemap({
                userId: userId,
                projectName: projectName || `Sitemap - ${new URL(validUrl).hostname}`,
                startUrl: validUrl,
                baseUrl: baseUrl,
                type: 'html',
                content: htmlOutput,
                pages: pagesData,
                crawlSettings: {
                    maxDepth: 3,
                    maxPages: 50,
                    puppeteerEnabled: true,
                    screenshotsEnabled: false
                },
                stats: {
                    totalDuration: totalDuration
                },
                sizeBytes: Buffer.byteLength(htmlOutput, 'utf8'),
                status: 'completed',
                createdAt: new Date()
            });
            
            try {
                savedSitemap = await sitemapDocument.save();
                console.log(`[CONTROLLER] ✅ Saved to database with ID: ${savedSitemap._id}`);
            } catch (dbError) {
                console.error('[CONTROLLER] ❌ Database save failed:', dbError.message);
                // Continue anyway - don't fail the request
            }
        }
        
        // ==================
        // 7. PREPARE RESPONSE
        // ==================
        
        const successfulPages = crawlResults.filter(r => r.success).length;
        const failedPages = crawlResults.filter(r => !r.success).length;
        
        const response = {
            success: true,
            message: 'HTML Sitemap generated successfully.',
            data: {
                html: htmlOutput,
                sitemapId: savedSitemap ? savedSitemap._id : null,
                summary: {
                    totalUrls: crawlResults.length,
                    successfulPages: successfulPages,
                    failedPages: failedPages,
                    successRate: `${Math.round((successfulPages / crawlResults.length) * 100)}%`,
                    duration: `${(totalDuration / 1000).toFixed(2)}s`,
                    baseUrl: baseUrl
                },
                statistics: savedSitemap ? savedSitemap.stats : null,
                warnings: validation.warnings.length > 0 ? validation.warnings : undefined
            }
        };
        
        console.log(`[CONTROLLER] ✅ Request completed in ${(totalDuration / 1000).toFixed(2)}s`);
        res.status(200).json(response);

    } catch (error) {
        console.error("[CONTROLLER] ❌ Error:", error.message);
        
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
            message: error.message,
            partialResults: crawlResults.length > 0 ? {
                pagesFound: crawlResults.length,
                suggestion: 'Some pages were crawled. Try reducing max depth or pages.'
            } : undefined
        });
    }
};

// ============================================
// GET SITEMAP BY ID
// ============================================

/**
 * Retrieve a previously generated sitemap
 * GET /api/sitemap/html/:id
 */
exports.getHtmlSitemap = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        console.log(`[CONTROLLER] 🔍 Retrieving sitemap: ${id}`);
        
        // Find sitemap by ID
        const sitemap = await Sitemap.findById(id);
        
        if (!sitemap) {
            return res.status(404).json({
                error: 'Sitemap not found',
                message: 'The requested sitemap does not exist or has been deleted.'
            });
        }
        
        // Return sitemap data
        res.status(200).json({
            success: true,
            data: {
                id: sitemap._id,
                projectName: sitemap.projectName,
                startUrl: sitemap.startUrl,
                type: sitemap.type,
                html: sitemap.content,
                stats: sitemap.stats,
                pages: sitemap.pages.map(p => ({
                    url: p.url,
                    title: p.metadata?.title,
                    statusCode: p.statusCode,
                    loadTime: p.loadTime,
                    depth: p.depth
                })),
                createdAt: sitemap.createdAt,
                updatedAt: sitemap.updatedAt,
                successRate: sitemap.successRate,
                hasIssues: sitemap.hasIssues
            }
        });
        
    } catch (error) {
        console.error("[CONTROLLER] ❌ Error retrieving sitemap:", error.message);
        res.status(500).json({ 
            error: 'Failed to retrieve sitemap',
            message: error.message
        });
    }
};

// ============================================
// GET ALL SITEMAPS FOR USER
// ============================================

/**
 * Get all sitemaps for a specific user
 * GET /api/sitemap/user/:userId
 */
exports.getUserSitemaps = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        
        console.log(`[CONTROLLER] 📋 Fetching sitemaps for user: ${userId}`);
        
        // Get sitemaps for user
        const sitemaps = await Sitemap.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-content -pages'); // Exclude large fields
        
        // Get total count
        const totalCount = await Sitemap.countDocuments({ userId });
        
        res.status(200).json({
            success: true,
            data: {
                sitemaps: sitemaps.map(s => s.getSummary()),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit
                }
            }
        });
        
    } catch (error) {
        console.error("[CONTROLLER] ❌ Error fetching user sitemaps:", error.message);
        res.status(500).json({ 
            error: 'Failed to fetch sitemaps',
            message: error.message
        });
    }
};

// ============================================
// DELETE SITEMAP
// ============================================

/**
 * Delete a sitemap by ID
 * DELETE /api/sitemap/:id
 */
exports.deleteSitemap = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId } = req.body; // For authorization
        
        console.log(`[CONTROLLER] 🗑️  Deleting sitemap: ${id}`);
        
        // Find and delete
        const sitemap = await Sitemap.findOneAndDelete({ 
            _id: id,
            userId: userId // Ensure user owns the sitemap
        });
        
        if (!sitemap) {
            return res.status(404).json({
                error: 'Sitemap not found',
                message: 'The sitemap does not exist or you do not have permission to delete it.'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Sitemap deleted successfully',
            deletedId: id
        });
        
    } catch (error) {
        console.error("[CONTROLLER] ❌ Error deleting sitemap:", error.message);
        res.status(500).json({ 
            error: 'Failed to delete sitemap',
            message: error.message
        });
    }
};

// ============================================
// GET SEO REPORT FOR SITEMAP
// ============================================

/**
 * Get detailed SEO report for a sitemap
 * GET /api/sitemap/:id/seo-report
 */
exports.getSEOReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        console.log(`[CONTROLLER] 📊 Generating SEO report for: ${id}`);
        
        const sitemap = await Sitemap.findById(id);
        
        if (!sitemap) {
            return res.status(404).json({
                error: 'Sitemap not found'
            });
        }
        
        const seoIssues = sitemap.getSEOReport();
        
        res.status(200).json({
            success: true,
            data: {
                sitemapId: id,
                startUrl: sitemap.startUrl,
                totalPages: sitemap.stats.totalPages,
                issuesFound: seoIssues.length,
                issues: seoIssues,
                summary: {
                    critical: seoIssues.filter(i => i.severity === 'high').length,
                    warnings: seoIssues.filter(i => i.severity === 'medium').length,
                    info: seoIssues.filter(i => i.severity === 'low').length
                }
            }
        });
        
    } catch (error) {
        console.error("[CONTROLLER] ❌ Error generating SEO report:", error.message);
        res.status(500).json({ 
            error: 'Failed to generate SEO report',
            message: error.message
        });
    }
};

// ============================================
// GET PERFORMANCE REPORT
// ============================================

/**
 * Get performance report for a sitemap
 * GET /api/sitemap/:id/performance
 */
exports.getPerformanceReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        console.log(`[CONTROLLER] ⚡ Generating performance report for: ${id}`);
        
        const sitemap = await Sitemap.findById(id);
        
        if (!sitemap) {
            return res.status(404).json({
                error: 'Sitemap not found'
            });
        }
        
        const performanceReport = sitemap.getPerformanceReport();
        
        res.status(200).json({
            success: true,
            data: {
                sitemapId: id,
                ...performanceReport
            }
        });
        
    } catch (error) {
        console.error("[CONTROLLER] ❌ Error generating performance report:", error.message);
        res.status(500).json({ 
            error: 'Failed to generate performance report',
            message: error.message
        });
    }
};

// ============================================
// EXPORT MODULE
// ============================================

// At the END of the file (should already have this):
module.exports = {
    generateHtmlSitemap: exports.generateHtmlSitemap,
    getHtmlSitemap: exports.getHtmlSitemap,
    getUserSitemaps: exports.getUserSitemaps,
    deleteSitemap: exports.deleteSitemap,
    getSEOReport: exports.getSEOReport,
    getPerformanceReport: exports.getPerformanceReport
};