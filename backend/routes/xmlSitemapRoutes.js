const express = require('express');
const router = express.Router();
const { generateXmlSitemap, downloadXmlSitemap } = require('../controllers/xmlSitemapController'); 

router.post('/generate-xml', generateXmlSitemap);
router.get('/download-xml/:id', downloadXmlSitemap);

module.exports = router;