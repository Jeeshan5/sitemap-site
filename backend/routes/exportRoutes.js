const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

function decodeDataUrl(dataUrl) {
  const matches = dataUrl.match(/^data:(.+);base64,(.*)$/s);
  if (!matches) return null;
  return { mime: matches[1], buffer: Buffer.from(matches[2], 'base64') };
}

// GET /api/export/:format -> advise using POST (backwards-compatible 501)
router.get('/:format', (req, res) => {
  res.status(501).json({ error: 'Use POST /api/export with payload { format, data }' });
});

// POST /api/export
// body: { format: 'pdf'|'svg'|'png'|'photo', data: string (dataURL or raw svg/html) }
router.post('/', async (req, res) => {
  try {
    const { format, data } = req.body || {};
    if (!format) return res.status(400).json({ error: 'format is required' });

    // PDF generation: render incoming html/svg/image into PDF using puppeteer
    if (format === 'pdf') {
      let html = '';
      let viewportW = 1200
      let viewportH = 800

      if (typeof data === 'string' && data.trim().startsWith('<svg')) {
        // If SVG provided, embed directly and try to infer dimensions
        const svgMarkup = data
        // try to read width/height attributes (simple regex)
        const wMatch = svgMarkup.match(/\bwidth=["']?(\d+)(px)?["']?/i)
        const hMatch = svgMarkup.match(/\bheight=["']?(\d+)(px)?["']?/i)
        if (wMatch) viewportW = parseInt(wMatch[1], 10)
        if (hMatch) viewportH = parseInt(hMatch[1], 10)
        html = `<!doctype html><html><body style="margin:0">${svgMarkup}</body></html>`;
      } else if (typeof data === 'string' && data.startsWith('data:')) {
        // If a raster image data URL was provided, embed it centered
        html = `<!doctype html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff"><img src="${data}" style="max-width:100%;height:auto"/></body></html>`;
      } else {
        html = `<!doctype html><html><body style="margin:0">${data || ''}</body></html>`;
      }

      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      // Use a higher device scale factor for crisper rendering
      await page.setViewport({ width: Math.max(800, viewportW), height: Math.max(600, viewportH), deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Prefer CSS page size when available; fallback to a pixel-based PDF sized to viewport
      let pdfBuffer
      try {
        pdfBuffer = await page.pdf({ printBackground: true, preferCSSPageSize: true, scale: 2 })
      } catch (e) {
        // fallback: explicit width/height
        pdfBuffer = await page.pdf({ printBackground: true, width: `${viewportW}px`, height: `${viewportH}px`, scale: 2 })
      }

      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="export.pdf"');
      return res.send(pdfBuffer);
    }

    // SVG export: return raw svg or convert dataURL
    if (format === 'svg') {
      let svg = '';
      if (typeof data === 'string' && data.startsWith('data:')) {
        const decoded = decodeDataUrl(data);
        if (decoded && decoded.mime === 'image/svg+xml') {
          svg = decoded.buffer.toString();
        } else if (decoded) {
          // Not SVG; embed as image inside an SVG wrapper
          const imgData = decoded.buffer.toString('base64');
          svg = `<svg xmlns="http://www.w3.org/2000/svg"><image href="data:${decoded.mime};base64,${imgData}"/></svg>`;
        }
      } else if (typeof data === 'string') {
        svg = data;
      }

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', 'attachment; filename="export.svg"');
      return res.send(svg || '');
    }

    // Image export: accept dataURL (fast) or render svg/html via puppeteer to PNG
    if (format === 'png' || format === 'photo' || format === 'jpg' || format === 'jpeg') {
      if (typeof data === 'string' && data.startsWith('data:')) {
        const decoded = decodeDataUrl(data);
        if (decoded) {
          res.setHeader('Content-Type', decoded.mime);
          res.setHeader('Content-Disposition', `attachment; filename="export.${format === 'photo' ? 'png' : format}"`);
          return res.send(decoded.buffer);
        }
      }

      // Fallback: render HTML/svg to PNG via puppeteer at higher device scale for quality
      const html = (typeof data === 'string' && data.trim().startsWith('<svg'))
        ? `<!doctype html><html><body style="margin:0">${data}</body></html>`
        : `<!doctype html><html><body style="margin:0">${data || ''}</body></html>`;

      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      // try to screenshot the full rendered body with high fidelity
      const buffer = await page.screenshot({ type: 'png', fullPage: true })
      await browser.close();

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename="export.png"');
      return res.send(buffer);
    }

    return res.status(400).json({ error: 'unsupported format' });
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Export failed', details: err.message });
  }
});

module.exports = router;
