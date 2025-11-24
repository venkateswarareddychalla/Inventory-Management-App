import React from 'react';

export default function ConfirmModal({ isOpen, title = 'Confirm', message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel} />
      <div className="bg-white rounded shadow-lg z-10 w-full max-w-sm p-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <button onClick={onCancel} className="px-3 py-1 rounded bg-gray-200">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
        </div>
      </div>
    </div>
  );
}
