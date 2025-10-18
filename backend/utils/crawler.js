// Add these configurations to your crawler

// 1. Handle SSL/TLS legacy issues
const https = require('https');
const axios = require('axios');

// Create custom axios instance with relaxed SSL
const createAxiosInstance = () => {
  return axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: true,
      secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT,
      minVersion: 'TLSv1',
      maxVersion: 'TLSv1.3'
    }),
    timeout: 15000, // Increase timeout to 15 seconds
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  });
};

// 2. Enhanced crawler function with retry logic
async function crawlWithRetry(url, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    timeout = 15000,
    depth = 1
  } = options;

  const axiosInstance = createAxiosInstance();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[CRAWLER] Attempt ${attempt}/${maxRetries}: Crawling ${url}`);
      
      const startTime = Date.now();
      const response = await axiosInstance.get(url, {
        timeout,
        validateStatus: (status) => status < 500 // Accept 4xx errors
      });
      
      const duration = Date.now() - startTime;
      
      if (response.status >= 400) {
        console.log(`[CRAWLER] Warning: Status ${response.status} for ${url}`);
      }
      
      console.log(`[CRAWLER] Success in ${duration}ms`);
      return {
        success: true,
        data: response.data,
        status: response.status,
        duration
      };
      
    } catch (error) {
      const errorType = getErrorType(error);
      console.log(`[CRAWLER] Attempt ${attempt} failed: ${errorType} - ${error.message}`);
      
      // Don't retry for certain error types
      if (shouldNotRetry(error)) {
        return {
          success: false,
          error: errorType,
          message: error.message,
          shouldRetry: false
        };
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        console.log(`[CRAWLER] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return {
    success: false,
    error: 'MAX_RETRIES_EXCEEDED',
    message: `Failed after ${maxRetries} attempts`
  };
}

// 3. Error classification
function getErrorType(error) {
  if (error.code === 'EPROTO' || error.message.includes('SSL')) {
    return 'SSL_ERROR';
  }
  if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    return 'TIMEOUT';
  }
  if (error.code === 'ECONNREFUSED') {
    return 'CONNECTION_REFUSED';
  }
  if (error.code === 'ENOTFOUND') {
    return 'DNS_ERROR';
  }
  if (error.response) {
    return `HTTP_${error.response.status}`;
  }
  return 'UNKNOWN_ERROR';
}

// 4. Determine if we should retry
function shouldNotRetry(error) {
  const noRetryErrors = [
    'ENOTFOUND', // DNS errors
    'ERR_INVALID_URL', // Invalid URL
  ];
  
  const noRetryStatuses = [400, 401, 403, 404, 410];
  
  if (noRetryErrors.includes(error.code)) {
    return true;
  }
  
  if (error.response && noRetryStatuses.includes(error.response.status)) {
    return true;
  }
  
  return false;
}

// 5. Alternative approach for JavaScript-heavy sites like Goibibo
// Use Puppeteer for sites that require JavaScript rendering
async function crawlWithPuppeteer(url, options = {}) {
  const puppeteer = require('puppeteer');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate with extended timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Get page content
    const content = await page.content();
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        .filter(href => href.startsWith('http'));
    });
    
    return {
      success: true,
      content,
      links: [...new Set(links)],
      url
    };
    
  } catch (error) {
    console.error(`[PUPPETEER] Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 6. Smart crawler that chooses the right method
async function smartCrawl(url, options = {}) {
  // Try regular crawl first (faster)
  const result = await crawlWithRetry(url, options);
  
  if (result.success) {
    return result;
  }
  
  // If timeout or known JS-heavy site, try Puppeteer
  const jsHeavySites = ['goibibo.com', 'makemytrip.com', 'booking.com'];
  const needsPuppeteer = 
    result.error === 'TIMEOUT' || 
    jsHeavySites.some(site => url.includes(site));
  
  if (needsPuppeteer && options.allowPuppeteer !== false) {
    console.log('[CRAWLER] Switching to Puppeteer for JavaScript rendering...');
    return await crawlWithPuppeteer(url, options);
  }
  
  return result;
}

// 7. Example usage in your route
app.post('/api/crawl', async (req, res) => {
  const { url, crawlType = 'xml' } = req.body;
  
  try {
    console.log(`Starting ${crawlType} crawl for: ${url}`);
    
    const result = await smartCrawl(url, {
      maxRetries: 3,
      timeout: 15000,
      allowPuppeteer: true
    });
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        message: result.message,
        suggestion: getSuggestion(result.error)
      });
    }
    
    // Process the successful result
    // ... your existing sitemap generation code
    
    res.json({
      success: true,
      urls: extractedUrls,
      duration: result.duration
    });
    
  } catch (error) {
    console.error('Crawl error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 8. Provide helpful suggestions
function getSuggestion(errorType) {
  const suggestions = {
    'SSL_ERROR': 'This site uses outdated SSL. Consider using a proxy or contacting the site administrator.',
    'TIMEOUT': 'Site is slow or requires JavaScript rendering. Try increasing timeout or using Puppeteer.',
    'CONNECTION_REFUSED': 'Site may be blocking automated requests. Check robots.txt and consider rate limiting.',
    'DNS_ERROR': 'Invalid URL or domain does not exist.',
    'HTTP_403': 'Access forbidden. Site may have anti-bot protection.',
    'HTTP_429': 'Rate limited. Wait before retrying.'
  };
  
  return suggestions[errorType] || 'Check the URL and try again.';
}

module.exports = {
  smartCrawl,
  crawlWithRetry,
  crawlWithPuppeteer
};