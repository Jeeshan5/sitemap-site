const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
// Allow larger payloads for export image/pdf data URLs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
const xmlSitemapRoutes = require('./routes/xmlSitemapRoutes');
const htmlSitemapRoutes = require('./routes/htmlSitemapRoutes');
const visualSitemapRoutes = require('./routes/visualSitemapRoutes');
const exportRoutes = require('./routes/exportRoutes');

app.use('/api', xmlSitemapRoutes);
app.use('/api', htmlSitemapRoutes);
app.use('/api', visualSitemapRoutes);
app.use('/api/export', exportRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sitemap Tools API is running' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message || 'Something went wrong!',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
