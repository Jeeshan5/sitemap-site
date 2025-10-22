const { validateUrl } = require('../utils/urlValidator');
const { startSafeCrawl } = require('../utils/intelligentCrawler');
const URL = require('url').URL;

exports.processVisualSitemap = async (req, res, next) => {
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

        // 6. Build hierarchical structure
        const pages = buildHierarchy(urlsFound, validUrl);

        // 7. Return response with warnings if any
        res.status(200).json({
            message: 'Visual sitemap data generated.',
            pages: pages,
            urlCount: urlsFound.length,
            warnings: validation.warnings.length > 0 ? validation.warnings : undefined
        });

    } catch (error) {
        console.error("Error in processVisualSitemap:", error.message);
        
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

exports.saveVisualSitemap = async (req, res, next) => {
    try {
        const { url, pages } = req.body;
        
        if (!url || !pages) {
            return res.status(400).json({ 
                error: 'URL and pages data are required.' 
            });
        }
        
        // TODO: Implement your save logic here
        const sitemapId = Date.now().toString();
        
        res.status(200).json({
            message: 'Visual sitemap saved successfully',
            id: sitemapId,
            note: 'Implement your sitemap storage logic here'
        });
        
    } catch (error) {
        console.error("Error in saveVisualSitemap:", error.message);
        res.status(500).json({ 
            error: 'Failed to save visual sitemap',
            message: error.message
        });
    }
};

// FIXED: Proper hierarchical tree builder
function buildHierarchy(urls, baseUrl) {
    if (!urls || urls.length === 0) return [];

    const base = new URL(baseUrl).origin;
    
    // Create a map to store all nodes
    const nodeMap = new Map();
    
    // First pass: Create all nodes
    urls.forEach(url => {
        const path = url.replace(base, '');
        const segments = path.split('/').filter(s => s);
        
        // Create full path for this URL
        let currentPath = '';
        segments.forEach((segment, index) => {
            const previousPath = currentPath;
            currentPath += '/' + segment;
            
            if (!nodeMap.has(currentPath)) {
                const fullUrl = base + currentPath;
                const title = segment
                    .replace(/-/g, ' ')
                    .replace(/_/g, ' ')
                    .replace(/\.(html|php|aspx)$/i, '')
                    .replace(/\b\w/g, l => l.toUpperCase());
                
                nodeMap.set(currentPath, {
                    url: fullUrl,
                    title: title || 'Home',
                    path: currentPath,
                    parentPath: previousPath || null,
                    children: []
                });
            }
        });
        
        // Add root/homepage if not already added
        if (segments.length === 0 || url === baseUrl) {
            if (!nodeMap.has('/')) {
                nodeMap.set('/', {
                    url: baseUrl,
                    title: 'Home',
                    path: '/',
                    parentPath: null,
                    children: []
                });
            }
        }
    });
    
    // Second pass: Build parent-child relationships
    const rootNodes = [];
    
    nodeMap.forEach((node, path) => {
        if (node.parentPath === null || node.parentPath === '') {
            // This is a root node
            rootNodes.push(node);
        } else {
            // Find parent and add this node as a child
            const parent = nodeMap.get(node.parentPath);
            if (parent) {
                parent.children.push(node);
            } else {
                // If parent not found, treat as root
                rootNodes.push(node);
            }
        }
    });
    
    // Clean up: Remove path and parentPath from final output
    const cleanNode = (node) => {
        const cleaned = {
            url: node.url,
            title: node.title,
            children: node.children.map(child => cleanNode(child))
        };
        return cleaned;
    };
    
    return rootNodes.map(node => cleanNode(node));
}

module.exports = {
    processVisualSitemap: exports.processVisualSitemap,
    saveVisualSitemap: exports.saveVisualSitemap
};