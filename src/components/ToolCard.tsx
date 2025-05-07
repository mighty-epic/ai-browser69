// src/components/ToolCard.tsx
'use client';

import React from 'react';
import { ToolWithTags } from '@/types';
import Link from 'next/link';

interface ToolCardProps {
  tool: ToolWithTags;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col h-full">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white truncate" title={tool.name}>
          {tool.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 h-20 overflow-hidden line-clamp-4" title={tool.description || ''}>
          {tool.description || 'No description available.'}
        </p>
        {tool.tags && tool.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {tool.tags.slice(0, 5).map(tag => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 text-xs font-medium rounded-full"
              >
                {tag.name}
              </span>
            ))}
            {tool.tags.length > 5 && (
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                    +{tool.tags.length - 5} more
                </span>
            )}
          </div>
        )}
      </div>
      <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <Link
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-300"
        >
          Visit Tool
        </Link>
      </div>
    </div>
  );
};

export default ToolCard;