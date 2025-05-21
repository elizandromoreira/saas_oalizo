import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  showDeletionOptions = false
}) => {
  const [deletionScope, setDeletionScope] = useState('database');
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Title */}
        <h2 
          id="modal-title"
          className="text-xl font-semibold mb-4 text-gray-900 dark:text-white pr-8"
        >
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {message}
        </p>

        {/* Deletion Options */}
        {showDeletionOptions && (
          <div className="mb-4 mt-2">
            <div className="flex items-center mb-2">
              <input
                type="radio"
                id="database-only"
                name="deletion-scope"
                value="database"
                checked={deletionScope === 'database'}
                onChange={() => setDeletionScope('database')}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="database-only" className="text-gray-700 dark:text-gray-300">
                Delete from database only
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="database-amazon"
                name="deletion-scope"
                value="both"
                checked={deletionScope === 'both'}
                onChange={() => setDeletionScope('both')}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="database-amazon" className="text-gray-700 dark:text-gray-300">
                Delete from database and Amazon
              </label>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={() => showDeletionOptions ? onConfirm(deletionScope) : onConfirm()}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg 
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;