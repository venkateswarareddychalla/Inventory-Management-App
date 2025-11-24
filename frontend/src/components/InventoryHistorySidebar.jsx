import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function InventoryHistorySidebar({ productId, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) {
      setLogs([]);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/products/${productId}/history`);
        setLogs(response.data);
      } catch (err) {
        setError('Failed to fetch inventory history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [productId]);

  if (!productId) return null;

  return (
    <div
      className="fixed top-0 right-0 h-full w-96 bg-white shadow-lg border-l border-gray-300 p-4 overflow-auto z-50"
      style={{ minWidth: '320px' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Inventory History</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800"
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && logs.length === 0 && <p>No history available for this product.</p>}

      {!loading && logs.length > 0 && (
        <table className="w-full text-left border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Old Quantity</th>
              <th className="border px-2 py-1">New Quantity</th>
              <th className="border px-2 py-1">Changed By</th>
              <th className="border px-2 py-1">Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="border px-2 py-1">{log.old_quantity}</td>
                <td className="border px-2 py-1">{log.new_quantity}</td>
                <td className="border px-2 py-1">{log.user_info || 'Unknown'}</td>
                <td className="border px-2 py-1">
                  {new Date(log.change_date).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
