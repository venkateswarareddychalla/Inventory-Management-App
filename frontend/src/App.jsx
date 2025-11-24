import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './components/Sidebar';
import ProductSearchFilter from './components/ProductSearchFilter';
import ProductTable from './components/ProductTable';
import InventoryHistorySidebar from './components/InventoryHistorySidebar';
import ConfirmModal from './components/ConfirmModal';

function App() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProducts = async (search = '', category = '') => {
    setLoading(true);
    try {
      const allResp = await axios.get('/api/products');
      let allProds = allResp.data;
      if (!Array.isArray(allProds)) {
        if (allProds && Array.isArray(allProds.data)) allProds = allProds.data;
        else allProds = [];
      }
      const cats = Array.from(new Set(allProds.map((p) => p.category).filter(Boolean)));
      setCategories(cats);

      let response;
      if (search) {
        response = await axios.get('/api/products', { params: { name: search } });
      } else {
        response = allResp;
      }

      let prods = response.data;
      if (!Array.isArray(prods)) {
        if (prods && Array.isArray(prods.data)) prods = prods.data;
        else prods = [];
      }

      if (category) {
        prods = prods.filter((p) => (p.category || '').toLowerCase() === category.toLowerCase());
      }
      setProducts(prods);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    fetchProducts(query, selectedCategory);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    fetchProducts(searchQuery, category);
  };

  const handleProductUpdated = (updatedProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
  };

  const handleViewHistory = (product) => {
    setSelectedProductForHistory(product.id);
  };

  const handleCloseHistory = () => setSelectedProductForHistory(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productPendingDelete, setProductPendingDelete] = useState(null);

  const pendingTimeoutRef = useRef(new Map());

  const handleDeleteClick = (product) => {

    setProductPendingDelete(product);
    setConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setProductPendingDelete(null);
    setConfirmOpen(false);
  };

  const finalizeDelete = async (id) => {
    try {
      await axios.delete(`/api/products/${id}`);
    } catch (err) {
      console.error('Final delete failed', err);
      toast.error('Failed to delete product on server');

      fetchProducts(searchQuery, selectedCategory);
    } finally {
      // cleanup timeout tracking
      pendingTimeoutRef.current.delete(id);
    }
  };

  const handleConfirmDelete = () => {
    if (!productPendingDelete) return;
    const prod = productPendingDelete;
    setConfirmOpen(false);

    setProducts((prev) => prev.filter((p) => p.id !== prod.id));

      const toastId = toast.success(
      ({ closeToast }) => (
        <div className="flex items-center justify-between">
          <span>Product deleted</span>
          <button
            onClick={() => {
              // cancel scheduled delete
              const t = pendingTimeoutRef.current.get(prod.id);
              if (t) clearTimeout(t);
              pendingTimeoutRef.current.delete(prod.id);
              // restore locally
              setProducts((prev) => [prod, ...prev]);
              toast.info('Deletion undone');
              closeToast();
            }}
            className="ml-3 px-2 py-1 bg-gray-200 rounded"
          >
            Undo
          </button>
        </div>
      ),
      { autoClose: 5000 }
    );

    //Time within which user can undo delete
    const timeoutId = setTimeout(() => {
      finalizeDelete(prod.id);
      toast.dismiss(toastId);
    }, 5000);

    pendingTimeoutRef.current.set(prod.id, timeoutId);

    // clear modal pending state
    setProductPendingDelete(null);
  };

  // Import CSV
  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('csvFile', file);
    try {
      const res = await axios.post('/api/products/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data && (res.data.added !== undefined || res.data.skipped !== undefined)) {
        const added = res.data.added || 0;
        const skipped = res.data.skipped || 0;
        toast.success(`Import finished — added: ${added}, skipped: ${skipped}`);
      } else {
        toast.success(res.data?.message || 'Import successful');
      }

      // Refresh full product list (clear filters) so newly imported rows are visible
      setSearchQuery('');
      setSelectedCategory('');
      await fetchProducts();
    } catch (err) {
      console.error('Import failed', err);
      if (err.response) {
        toast.error(`Import failed — ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      } else {
        toast.error('Import failed');
      }
    } finally {
      e.target.value = null;
    }
  };

  const handleExport = async () => {
    try {
      const res = await axios.get('/api/products/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Export failed');
    }
  };

  // Add new product (simple modal + POST)
  const [newProduct, setNewProduct] = useState({ name: '', unit: '', category: '', brand: '', stock: 0, image: '' });

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const handleNewChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((p) => ({ ...p, [name]: name === 'stock' ? Number(value) : value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/products', newProduct);
      setProducts((prev) => [res.data, ...prev]);
      setNewProduct({ name: '', unit: '', category: '', brand: '', stock: 0, image: '' });
      closeAddModal();
      toast.success('Product added');
    } catch (err) {
      console.error('Add failed', err);
      toast.error('Failed to add product');
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Products</h1>
        </div>

        <ProductSearchFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onAddNew={openAddModal}
          onImport={handleImportClick}
          onExport={handleExport}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="bg-white p-4 rounded shadow">
          {loading ? (
            <p className='text-center'>Loading...</p>
          ) : (
            <ProductTable
              products={products}
              onProductUpdated={handleProductUpdated}
              onViewHistory={handleViewHistory}
              onDelete={(id) => {
                const prod = products.find((p) => p.id === id);
                if (prod) handleDeleteClick(prod);
              }}
            />
          )}
        </div>

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

        {showAddModal && (
          <div className="fixed inset-0 bg-amber-50 flex items-center justify-center z-10">
            <div className="bg-white rounded p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Add New Product</h2>
              <form onSubmit={handleAddSubmit} className="space-y-2">
                <input name="name" placeholder="Name" value={newProduct.name} onChange={handleNewChange} className="w-full border px-2 py-1 rounded" required />
                <input name="unit" placeholder="Unit" value={newProduct.unit} onChange={handleNewChange} className="w-full border px-2 py-1 rounded" />
                <input name="category" placeholder="Category" value={newProduct.category} onChange={handleNewChange} className="w-full border px-2 py-1 rounded" />
                <input name="brand" placeholder="Brand" value={newProduct.brand} onChange={handleNewChange} className="w-full border px-2 py-1 rounded" />
                <input name="stock" type="number" min="0" placeholder="Stock" value={newProduct.stock} onChange={handleNewChange} className="w-full border px-2 py-1 rounded" />
                <input name="image" placeholder="Image URL" value={newProduct.image} onChange={handleNewChange} className="w-full border px-2 py-1 rounded" />
                <div className="flex justify-end space-x-2 mt-3">
                  <button type="button" onClick={closeAddModal} className="px-3 py-1 rounded bg-gray-200">Cancel</button>
                  <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedProductForHistory && (
          <InventoryHistorySidebar productId={selectedProductForHistory} onClose={handleCloseHistory} />
        )}
        <ConfirmModal
          isOpen={confirmOpen}
          title="Delete Product"
          message={productPendingDelete ? `Delete "${productPendingDelete.name}"? This action can be undone within a few seconds.` : 'Delete selected product?'}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </main>
    </div>
  );

}

export default App;

