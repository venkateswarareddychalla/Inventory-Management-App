const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();

// Open DB connection (will be initialized by imported db object)
const db = new sqlite3.Database(path.resolve(__dirname, '../inventory.db'));

// Helper function to run DB queries with Promise wrappers
function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// GET /api/products?name=searchTerm
exports.getProducts = async (req, res) => {
  try {
    const nameQuery = req.query.name ? req.query.name.trim().toLowerCase() : null;
    let sql = 'SELECT * FROM products';
    let params = [];

    if (nameQuery) {
      sql += ' WHERE LOWER(name) LIKE ?';
      params.push(`%${nameQuery}%`);
    }

    const products = await dbAll(sql, params);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    unit,
    category,
    brand,
    stock,
    status,
    image
  } = req.body;

  try {
    // Check if product exists
    const existingProduct = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate name uniqueness except for this product
    const nameConflict = await dbGet('SELECT id FROM products WHERE LOWER(name) = LOWER(?) AND id != ?', [name, id]);
    if (nameConflict) {
      return res.status(400).json({ error: 'Product name must be unique' });
    }

    // Capture old stock for history tracking
    const oldStock = existingProduct.stock;

    // Update product record
    await dbRun(
      `UPDATE products SET name = ?, unit = ?, category = ?, brand = ?, stock = ?, status = ?, image = ? WHERE id = ?`,
      [name, unit, category, brand, stock, status, image, id]
    );

    // Insert inventory history if stock has changed
    if (oldStock !== stock) {
      await dbRun(
        `INSERT INTO inventory_history (product_id, old_quantity, new_quantity, change_date, user_info)
         VALUES (?, ?, ?, ?, ?)`,
        [id, oldStock, stock, new Date().toISOString(), 'admin'] // Hard-coded "admin" user_info; can be enhanced
      );
    }

    // Return updated product
    const updatedProduct = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
    res.json(updatedProduct);

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// POST /api/products/import
exports.importProducts = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required' });
  }

  const filePath = req.file.path;
  const added = [];
  const skipped = [];
  const duplicates = [];

  const productsToInsert = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (row) => {
      // Normalize name to trim and ignore case for checking duplicates
      if (row.name) {
        productsToInsert.push({
          name: row.name.trim(),
          unit: row.unit || '',
          category: row.category || '',
          brand: row.brand || '',
          stock: parseInt(row.stock, 10) || 0,
          status: row.status || '',
          image: row.image || ''
        });
      }
    })
    .on('end', async () => {
      try {
        for (const product of productsToInsert) {
          const existing = await dbGet('SELECT id FROM products WHERE LOWER(name) = LOWER(?)', [product.name]);
          if (existing) {
            duplicates.push({ name: product.name, existingId: existing.id });
            skipped.push(product);
          } else {
            await dbRun(
              `INSERT INTO products (name, unit, category, brand, stock, status, image)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [product.name, product.unit, product.category, product.brand, product.stock, product.status, product.image]
            );
            added.push(product);
          }
        }

        // Remove uploaded file after processing
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting uploaded CSV file:', err);
        });

        res.json({ added: added.length, skipped: skipped.length, duplicates });

      } catch (error) {
        console.error('Error processing CSV import:', error);
        res.status(500).json({ error: 'Failed to import products' });
      }
    })
    .on('error', (err) => {
      console.error('Error reading CSV file:', err);
      res.status(500).json({ error: 'Failed to read CSV file' });
    });
};

// GET /api/products/export
exports.exportProducts = async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM products ORDER BY id ASC');
    // Build CSV string with header line
    const headers = ['id', 'name', 'unit', 'category', 'brand', 'stock', 'status', 'image'];
    const csvLines = [headers.join(',')];

    for (const product of products) {
      // Escape values that may contain commas or quotes
      const row = headers.map((field) => {
        let val = product[field] !== null && product[field] !== undefined ? product[field].toString() : '';
        if (val.includes(',') || val.includes('"')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvLines.push(row.join(','));
    }

    const csvData = csvLines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.status(200).send(csvData);

  } catch (error) {
    console.error('Error exporting products:', error);
    res.status(500).json({ error: 'Failed to export products' });
  }
};

// GET /api/products/:id/history
exports.getProductHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const logs = await dbAll(
      `SELECT * FROM inventory_history WHERE product_id = ? ORDER BY change_date DESC`,
      [id]
    );

    res.json(logs);

  } catch (error) {
    console.error('Error fetching inventory history:', error);
    res.status(500).json({ error: 'Failed to fetch inventory history' });
  }
};

// POST /api/products - create a new product
exports.createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, unit = '', category = '', brand = '', stock = 0, status = '', image = '' } = req.body;

  try {
    // Check name uniqueness
    const existing = await dbGet('SELECT id FROM products WHERE LOWER(name) = LOWER(?)', [name]);
    if (existing) {
      return res.status(400).json({ error: 'Product name must be unique' });
    }

    const result = await dbRun(
      `INSERT INTO products (name, unit, category, brand, stock, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, unit, category, brand, stock, status, image]
    );

    const created = await dbGet('SELECT * FROM products WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete product
    await dbRun('DELETE FROM products WHERE id = ?', [id]);
    // Optionally delete its history
    await dbRun('DELETE FROM inventory_history WHERE product_id = ?', [id]);

    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
