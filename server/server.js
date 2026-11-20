import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Body parser with 30mb limit for laptop image uploads
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// Serve uploaded product imagery statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Dispensary API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    dispensary: 'Ash-Shifa Herbals API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.send('🌿 Ash-Shifa Herbal Dispensary API - Operational');
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Apothecary route ${req.originalUrl} not found`,
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Pharmacopeia Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`🌿 Ash-Shifa Herbal Dispensary Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`💊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==============================================\n`);
});

export default app;
