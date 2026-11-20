import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  setProductPrice,
  seedProductsToSupabase,
} from '../controllers/productController.js';

const router = express.Router();

// GET /api/products - List all remedies from Supabase
router.get('/', getAllProducts);

// GET /api/products/:id - Single remedy with strictly 4 images
router.get('/:id', getProductById);

// POST /api/products - Add/Create product (Admin Portal)
router.post('/', createProduct);

// PUT /api/products/:id - Update product details (Admin Portal)
router.put('/:id', updateProduct);

// DELETE /api/products/:id - Delete product (Admin Portal)
router.delete('/:id', deleteProduct);

// PUT /api/products/:id/price - Set price through backend
router.put('/:id/price', setProductPrice);

// POST /api/products/seed - Seed default compendium products into Supabase
router.post('/seed', seedProductsToSupabase);

export default router;
