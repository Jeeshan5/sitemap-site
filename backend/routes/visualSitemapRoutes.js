const express = require('express');
const router = express.Router();
const visualSitemapController = require('../controllers/visualSitemapController'); 

router.post('/generate-visual', visualSitemapController.processVisualSitemap);
router.post('/save', visualSitemapController.saveVisualSitemap);

module.exports = router;