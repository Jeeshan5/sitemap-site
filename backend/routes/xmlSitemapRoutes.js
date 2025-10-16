const express = require('express');
const router = express.Router();
// You will create this controller later
const xmlSitemapController = require('../controllers/xmlSitemapController'); 

// Endpoint to start XML Sitemap generation (requires the target URL)
router.post('/generate', xmlSitemapController.generateXmlSitemap);

// Endpoint to download the final XML file
router.get('/download/:id', xmlSitemapController.downloadXmlSitemap);

module.exports = router;