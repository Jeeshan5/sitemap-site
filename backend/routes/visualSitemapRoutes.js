const express = require('express');
const router = express.Router();
const visualSitemapController = require('../controllers/visualSitemapController'); 

// Change '/process' to '/generate-visual' to match frontend
router.post('/generate-visual', visualSitemapController.processVisualSitemap);
router.post('/save', visualSitemapController.saveVisualSitemap);

module.exports = router;