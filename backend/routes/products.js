const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');
const productsController = require('../controllers/productsController');

const upload = multer({ dest: 'uploads/' });

// GET /api/products?name=searchTerm
router.get('/', productsController.getProducts);

// PUT /api/products/:id
router.put(
  '/:id',
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('unit').optional().isString(),
    body('category').optional().isString(),
    body('brand').optional().isString(),
    body('status').optional().isString(),
    body('image').optional().isString()
  ],
  productsController.updateProduct
);

// POST /api/products  (create new product)
router.post(
  '/',
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('unit').optional().isString(),
    body('category').optional().isString(),
    body('brand').optional().isString(),
    body('status').optional().isString(),
    body('image').optional().isString(),
  ],
  productsController.createProduct
);

// POST /api/products/import
router.post('/import', upload.single('csvFile'), productsController.importProducts);

// GET /api/products/export
router.get('/export', productsController.exportProducts);

// GET /api/products/:id/history
router.get('/:id/history', productsController.getProductHistory);

// DELETE /api/products/:id
router.delete('/:id', productsController.deleteProduct);

module.exports = router;
