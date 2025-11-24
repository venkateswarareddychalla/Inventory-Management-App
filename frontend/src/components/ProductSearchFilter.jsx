import React, { useState, useEffect } from 'react';

export default function ProductSearchFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onAddNew,
  onImport,
  onExport
}) {
  const [searchText, setSearchText] = useState(searchQuery || '');

  // Handle search input changes
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    onSearchChange(val);
  };

  // Handle category selection change
  const handleCategoryChange = (e) => {
    onCategoryChange(e.target.value);
  };

  return (
    <div className="flex flex-wrap justify-between items-center mb-4 p-2 border-b border-gray-300">
      <div className="flex flex-wrap items-center space-x-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchText}
          onChange={handleSearchChange}
          className="px-3 py-1 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="px-3 py-1 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <button
          onClick={onAddNew}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Add New Product
        </button>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onImport}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          Import
        </button>
        <button
          onClick={onExport}
          className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
        >
          Export
        </button>
      </div>
    </div>
  );
}
