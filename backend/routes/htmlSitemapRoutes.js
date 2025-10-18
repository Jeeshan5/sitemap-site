const express = require('express');
const router = express.Router();
const htmlSitemapController = require('../controllers/htmlSitemapController'); 

// Change '/generate' to '/generate-html' to match frontend
router.post('/generate-html', htmlSitemapController.generateHtmlSitemap);
router.get('/:id', htmlSitemapController.getHtmlSitemap);

module.exports = router;