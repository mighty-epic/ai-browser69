// src/components/LoadingSpinner.tsx
'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // e.g., 'text-blue-500'
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'text-blue-600 dark:text-blue-400', 
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-solid border-t-transparent ${sizeClasses[size]} ${color}`}
        style={{ borderTopColor: 'transparent' }} // Ensure transparent top border for spinner effect
      ></div>
      {text && <p className={`mt-2 text-sm text-gray-600 dark:text-gray-300 ${color.replace('text-', 'text-opacity-80-')}`}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;