const URL = require('url').URL;

/**
 * Categorizes URLs by type (pages, blogs, images, etc.)
 * @param {Array<string>} urls - List of URLs to categorize
 * @param {string} baseUrl - The base URL origin
 * @returns {Object} Categorized URLs
 */
function categorizeUrls(urls, baseUrl) {
    const categories = {
        pages: [],
        blogs: [],
        images: [],
        media: [],
        other: []
    };

    urls.forEach(url => {
        const lowerUrl = url.toLowerCase();
        
        // Detect blog posts
        if (lowerUrl.includes('/blog') || lowerUrl.includes('/post') || 
            lowerUrl.includes('/article') || lowerUrl.includes('/news')) {
            categories.blogs.push(url);
        }
        // Detect images
        else if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            categories.images.push(url);
        }
        // Detect other media
        else if (lowerUrl.match(/\.(pdf|doc|docx|mp4|mp3|zip)$/i)) {
            categories.media.push(url);
        }
        // Everything else is a page
        else if (!lowerUrl.match(/\.(css|js|json|xml)$/i)) {
            categories.pages.push(url);
        }
        // Fallback for unrecognized types
        else {
            categories.other.push(url);
        }
    });

    return categories;
}

/**
 * Builds a nested tree structure from flat URL array
 * @param {Array<string>} urls - URLs to organize
 * @param {string} baseUrl - Base URL for path calculation
 * @returns {Object} Tree structure
 */
function buildUrlTree(urls, baseUrl) {
    const tree = {};

    urls.forEach(url => {
        let path = url.replace(baseUrl, '').replace(/^\//, '');
        if (path === '') path = 'Home';
        
        const segments = path.split('/').filter(segment => segment !== '');
        let currentNode = tree;
        let fullPath = baseUrl;

        segments.forEach((segment, index) => {
            fullPath += (index === 0 && fullPath !== baseUrl ? '' : '/') + segment;
            
            if (!currentNode[segment]) {
                currentNode[segment] = { 
                    url: fullPath, 
                    children: {} 
                };
            }
            currentNode = currentNode[segment].children;
        });
    });

    return tree;
}

/**
 * Recursively builds nested HTML list from tree structure
 * @param {Object} node - Tree node to process
 * @returns {string} HTML string
 */
function buildNestedList(node) {
    let html = '<ul class="sitemap-list">';
    
    for (const segment in node) {
        const item = node[segment];
        const displayTitle = segment
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());

        html += `<li class="sitemap-item">
            <a href="${item.url}" class="sitemap-link">${displayTitle}</a>`;
        
        if (Object.keys(item.children).length > 0) {
            html += buildNestedList(item.children);
        }
        html += '</li>';
    }
    
    html += '</ul>';
    return html;
}

/**
 * Creates hierarchical HTML sitemap with categories
 * @param {Array<string>} urls - All crawled URLs
 * @param {string} startUrl - Starting URL
 * @returns {string} Complete HTML document
 */
exports.buildHtmlSitemap = (urls, startUrl) => {
    if (urls.length === 0) {
        return '<h1>No pages were found during the crawl.</h1>';
    }

    let baseUrl;
    try {
        baseUrl = new URL(startUrl).origin;
    } catch (e) {
        baseUrl = new URL(urls[0]).origin;
    }
    
    // Categorize URLs by type
    const categorized = categorizeUrls(urls, baseUrl);
    
    // Build section HTML for each category
    let sectionsHtml = '';
    
    if (categorized.pages.length > 0) {
        const pageTree = buildUrlTree(categorized.pages, baseUrl);
        sectionsHtml += `
        <section class="sitemap-section">
            <h2 class="section-title">
                <span class="section-icon">📄</span>
                Pages (${categorized.pages.length})
            </h2>
            <div class="section-content">
                ${buildNestedList(pageTree)}
            </div>
        </section>`;
    }
    
    if (categorized.blogs.length > 0) {
        const blogTree = buildUrlTree(categorized.blogs, baseUrl);
        sectionsHtml += `
        <section class="sitemap-section">
            <h2 class="section-title">
                <span class="section-icon">📝</span>
                Blog Posts (${categorized.blogs.length})
            </h2>
            <div class="section-content">
                ${buildNestedList(blogTree)}
            </div>
        </section>`;
    }
    
    if (categorized.images.length > 0) {
        const imageTree = buildUrlTree(categorized.images, baseUrl);
        sectionsHtml += `
        <section class="sitemap-section">
            <h2 class="section-title">
                <span class="section-icon">🖼️</span>
                Images (${categorized.images.length})
            </h2>
            <div class="section-content">
                ${buildNestedList(imageTree)}
            </div>
        </section>`;
    }
    
    if (categorized.media.length > 0) {
        const mediaTree = buildUrlTree(categorized.media, baseUrl);
        sectionsHtml += `
        <section class="sitemap-section">
            <h2 class="section-title">
                <span class="section-icon">🎬</span>
                Media Files (${categorized.media.length})
            </h2>
            <div class="section-content">
                ${buildNestedList(mediaTree)}
            </div>
        </section>`;
    }

    // Final HTML document with enhanced styling
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Sitemap - ${baseUrl}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        h1 {
            color: #2d3748;
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .site-url {
            text-align: center;
            color: #667eea;
            font-size: 1.1rem;
            margin-bottom: 40px;
            text-decoration: none;
            display: block;
        }
        
        .site-url:hover {
            text-decoration: underline;
        }
        
        .sitemap-section {
            margin-bottom: 40px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .sitemap-section:hover {
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }
        
        .section-title {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            user-select: none;
        }
        
        .section-icon {
            font-size: 1.8rem;
        }
        
        .section-content {
            padding: 20px;
            background: #f7fafc;
        }
        
        .sitemap-list {
            list-style: none;
            padding-left: 0;
        }
        
        .sitemap-list ul {
            padding-left: 30px;
            margin-top: 10px;
        }
        
        .sitemap-item {
            margin: 8px 0;
            padding: 8px 0;
        }
        
        .sitemap-link {
            color: #4a5568;
            text-decoration: none;
            font-size: 1rem;
            padding: 6px 12px;
            border-radius: 6px;
            display: inline-block;
            transition: all 0.2s ease;
        }
        
        .sitemap-link:hover {
            background: #667eea;
            color: white;
            transform: translateX(5px);
        }
        
        .stats {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: #f7fafc;
            border-radius: 12px;
            color: #4a5568;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }
            
            h1 {
                font-size: 1.8rem;
            }
            
            .section-title {
                font-size: 1.2rem;
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📍 HTML Sitemap</h1>
        <a href="${baseUrl}" class="site-url">${baseUrl}</a>
        
        ${sectionsHtml}
        
        <div class="stats">
            <strong>Total URLs:</strong> ${urls.length} | 
            <strong>Pages:</strong> ${categorized.pages.length} | 
            <strong>Blogs:</strong> ${categorized.blogs.length} | 
            <strong>Images:</strong> ${categorized.images.length}
        </div>
    </div>
    
    <script>
        // Optional: Add click-to-collapse functionality
        document.querySelectorAll('.section-title').forEach(title => {
            title.addEventListener('click', () => {
                const content = title.nextElementSibling;
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
            });
        });
    </script>
</body>
</html>
`;
};