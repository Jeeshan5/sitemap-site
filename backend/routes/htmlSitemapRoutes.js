const express = require('express');
const router = express.Router();
// You will create this controller later
const htmlSitemapController = require('../controllers/htmlSitemapController'); 

// Endpoint to start HTML Sitemap generation
router.post('/generate', htmlSitemapController.generateHtmlSitemap);

// Endpoint to fetch a saved HTML Sitemap
router.get('/:id', htmlSitemapController.getHtmlSitemap);

module.exports = router;