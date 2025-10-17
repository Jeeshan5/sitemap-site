const URL = require('url').URL;

/**
 * Creates a nested, accessible HTML structure (typically an unordered list)
 * from a flat array of absolute URLs.
 * * @param {Array<string>} urls - The list of absolute URLs found by the crawler.
 * @param {string} startUrl - The initial URL to determine the root path.
 * @returns {string} The HTML structure (e.g., <html>...</html>).
 */
exports.buildHtmlSitemap = (urls, startUrl) => {
    if (urls.length === 0) {
        return '<h1>No pages were found during the crawl.</h1>';
    }

    let baseUrl;
    try {
        baseUrl = new URL(startUrl).origin + new URL(startUrl).pathname.replace(/\/$/, '');
    } catch (e) {
        // Fallback if startUrl is invalid, though it should be validated in the controller
        baseUrl = new URL(urls[0]).origin;
    }
    
    // 1. Prepare data into a path-based map for nesting
    const tree = {};

    urls.forEach(url => {
        let path = url.replace(baseUrl, '').replace(/^\//, ''); // Remove base URL and leading slash
        if (path === '') path = 'Home'; // Rename root path for display
        
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

    // 2. Recursive function to build the nested <ul> list
    const buildList = (node) => {
        let html = '<ul>';
        
        for (const segment in node) {
            const item = node[segment];
            const displayTitle = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Format slug to title

            html += `<li><a href="${item.url}">${displayTitle}</a>`;
            
            if (Object.keys(item.children).length > 0) {
                html += buildList(item.children);
            }
            html += '</li>';
        }
        
        html += '</ul>';
        return html;
    };

    const sitemapBody = buildList(tree);

    // 3. Wrap in a minimal HTML document for display
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Sitemap for ${baseUrl}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; }
        h1 { color: #333; }
        ul { list-style: none; padding-left: 20px; }
        ul li { margin: 5px 0; }
        a { text-decoration: none; color: #007bff; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>HTML Sitemap for: <a href="${baseUrl}">${baseUrl}</a></h1>
    <div id="sitemap-container">
        ${sitemapBody}
    </div>
</body>
</html>
`;
};
