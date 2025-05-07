// src/components/TagFilter.tsx
'use client';

import React from 'react';
import { Tag } from '@/types'; // Corrected import path from '@/types/supabase' to '@/types'

interface TagFilterProps {
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ tags, selectedTags, onTagToggle }) => {
  if (!tags || tags.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No tags available.</p>;
  }

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Filter by Tags</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => onTagToggle(tag.id)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ease-in-out 
              focus:outline-none focus:ring-2 focus:ring-opacity-50
              ${selectedTags.includes(tag.id)
                ? 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-400'
              }
            `}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagFilter;