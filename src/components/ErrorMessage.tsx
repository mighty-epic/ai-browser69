// src/components/ErrorMessage.tsx
'use client';

import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorMessageProps {
  message: string;
  title?: string;
  className?: string;
  onDismiss?: () => void; // Add onDismiss prop
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  title = 'An error occurred',
  className = '',
  onDismiss // Destructure onDismiss
}) => {
  return (
    <div 
      className={`p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 border border-red-300 dark:border-red-600 shadow-md ${className}`}
      role="alert"
    >
      <div className="flex items-center">
        <ExclamationTriangleIcon className="flex-shrink-0 inline w-5 h-5 mr-3" />
        <span className="sr-only">Error</span>
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
      <div className="mt-2 mb-4 text-sm">
        {message}
      </div>
      {/* Optional: Add a button for retrying or dismissing */}
      {onDismiss && (
        <div className="flex mt-3">
          <button 
            type="button" 
            onClick={onDismiss} 
            className="text-red-800 bg-transparent border border-red-800 hover:bg-red-900 hover:text-white focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-xs px-3 py-1.5 text-center dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white dark:focus:ring-red-800"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;