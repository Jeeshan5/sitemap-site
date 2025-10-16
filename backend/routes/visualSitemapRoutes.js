const express = require('express');
const router = express.Router();
// You will create this controller later
const visualSitemapController = require('../controllers/visualSitemapController'); 

// Endpoint to generate/process data for the visual map
router.post('/process', visualSitemapController.processVisualSitemap);

// Endpoint to save the user's customized visual map layout
router.post('/save', visualSitemapController.saveVisualSitemap);

module.exports = router;