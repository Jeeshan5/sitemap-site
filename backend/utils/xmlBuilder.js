const xml2js = require('xml2js');

const BASE_URL_OPTIONS = {
    // For generating the root <urlset> tag with namespaces
    rootName: 'urlset',
    attr: {
        'xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9'
    }
};

/**
 * Takes an array of raw URLs and formats them into a standard XML sitemap string.
 * NOTE: This function uses default values for changefreq, priority, and lastmod
 * as the crawler cannot reliably determine these values.
 * @param {Array<string>} urls - The list of absolute URLs found by the crawler.
 * @returns {Promise<string>} The complete XML sitemap string.
 */
exports.buildXmlSitemap = (urls) => {
    // Structure required by xml2js: an object containing the root tag content
    const urlset = {
        url: urls.map(url => ({
            loc: url,
            lastmod: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            changefreq: 'monthly', // Default assumption
            priority: 0.8 // Default priority
        }))
    };

    // Use a Builder instance to convert the JavaScript object to XML
    const builder = new xml2js.Builder(BASE_URL_OPTIONS);
    
    // Build the XML string
    const xml = builder.buildObject(urlset);
    
    return xml;
};
