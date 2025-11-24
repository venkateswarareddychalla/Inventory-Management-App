import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const statusStyles = {
  inStock: 'text-green-600 font-semibold',
  outOfStock: 'text-red-600 font-semibold',
};

export default function ProductTable({ products, onProductUpdated, onViewHistory, onDelete }) {
  // Defensive: ensure products is an array to avoid runtime errors if API returns unexpected shape
  const safeProducts = Array.isArray(products) ? products : [];
  const [editRowId, setEditRowId] = useState(null);
  const [editedProduct, setEditedProduct] = useState({});

  // Handle input changes for inline editing
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct((prev) => ({
      ...prev,
      [name]: name === 'stock' ? Number(value) : value,
    }));
  };

  // Start editing a product row
  const handleEditClick = (product) => {
    setEditRowId(product.id);
    setEditedProduct({ ...product });
  };

  // Cancel editing
  const handleCancelClick = () => {
    setEditRowId(null);
    setEditedProduct({});
  };

  // Save updated product via API call
  const handleSaveClick = async () => {
    try {
      const updatedData = { ...editedProduct };
      // Exclude id from payload
      delete updatedData.id;

      // PUT request to backend API
      const response = await axios.put(`/api/products/${editRowId}`, updatedData);
      if (response.status === 200) {
        onProductUpdated(response.data);
        setEditRowId(null);
        setEditedProduct({});
        toast.success('Product updated');
      } else {
        toast.error('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error updating product');
    }
  };

  // Render stock status badge
  const renderStockStatus = (stock) => {
    if (stock === 0) {
      return <span className={statusStyles.outOfStock}>Out of Stock</span>;
    }
    return <span className={statusStyles.inStock}>In Stock</span>;
  };

  return (
    <table className="min-w-full border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-3 py-2">Image</th>
          <th className="border px-3 py-2">Name</th>
          <th className="border px-3 py-2">Unit</th>
          <th className="border px-3 py-2">Category</th>
          <th className="border px-3 py-2">Brand</th>
          <th className="border px-3 py-2">Stock</th>
          <th className="border px-3 py-2">Status</th>
          <th className="border px-3 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {safeProducts.length === 0 && (
          <tr>
            <td colSpan="8" className="text-center py-4">
              No products found.
            </td>
          </tr>
        )}
        {safeProducts.map((product) => (
          <tr key={product.id} className="text-center">
            <td className="border px-3 py-2">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-12 w-12 object-contain mx-auto"
                />
              ) : (
                <div className="h-12 w-12 bg-gray-200 flex items-center justify-center text-gray-500">
                  N/A
                </div>
              )}
            </td>

            {editRowId === product.id ? (
              <>
                <td className="border px-3 py-2">
                  <input
                    type="text"
                    name="name"
                    value={editedProduct.name || ''}
                    onChange={handleInputChange}
                    className="w-full border rounded px-1 py-1"
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    type="text"
                    name="unit"
                    value={editedProduct.unit || ''}
                    onChange={handleInputChange}
                    className="w-full border rounded px-1 py-1"
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    type="text"
                    name="category"
                    value={editedProduct.category || ''}
                    onChange={handleInputChange}
                    className="w-full border rounded px-1 py-1"
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    type="text"
                    name="brand"
                    value={editedProduct.brand || ''}
                    onChange={handleInputChange}
                    className="w-full border rounded px-1 py-1"
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    name="stock"
                    value={editedProduct.stock || 0}
                    onChange={handleInputChange}
                    className="w-full border rounded px-1 py-1"
                  />
                </td>
                <td className="border px-3 py-2">{renderStockStatus(editedProduct.stock)}</td>
                <td className="border px-3 py-2">
                  <button
                    onClick={handleSaveClick}
                    className="mr-2 bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelClick}
                    className="bg-gray-300 text-black px-2 py-1 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </td>
              </>
            ) : (
              <>
                <td className="border px-3 py-2">{product.name}</td>
                <td className="border px-3 py-2">{product.unit}</td>
                <td className="border px-3 py-2">{product.category}</td>
                <td className="border px-3 py-2">{product.brand}</td>
                <td className="border px-3 py-2">{product.stock}</td>
                <td className="border px-3 py-2">{renderStockStatus(product.stock)}</td>
                <td className="border px-3 py-3">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="mr-2 bg-green-500 text-white p-2 rounded hover:bg-green-600"
                    title="Edit"
                    aria-label={`Edit ${product.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h6M4 15.25V19h3.75L17.81 8.94l-3.75-3.75L4 15.25z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => onViewHistory(product)}
                    className="mr-2 bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
                    title="View history"
                    aria-label={`View history for ${product.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => onDelete && onDelete(product.id)}
                    className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                    title="Delete"
                    aria-label={`Delete ${product.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                    </svg>
                  </button>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
