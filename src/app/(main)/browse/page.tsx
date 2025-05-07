// src/app/(main)/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ToolWithTags, Tag } from '@/types';
import ToolCard from '@/components/ToolCard';
import SearchBar from '@/components/SearchBar';
import TagFilter from '@/components/TagFilter';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

const ITEMS_PER_PAGE = 12;

export default function HomePage() {
  const [tools, setTools] = useState<ToolWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0); // Added totalItems state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.statusText}`);
      }
      const data = await response.json();
      setTags(data.tags || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError('Could not load tags. Please try again later.');
      // Keep existing tags if fetch fails, or clear them:
      // setTags([]); 
    }
  }, []);

  const fetchTools = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('query', searchTerm);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(`/api/tools?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch tools' }));
        throw new Error(errorData.error || `Failed to fetch tools: ${response.statusText}`);
      }
      const data = await response.json();
      setTools(data.tools || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalCount || 0); // Assuming API returns totalCount
    } catch (err: any) {
      console.error('Error fetching tools:', err);
      setError(err.message || 'Could not load tools. Please try again later.');
      setTools([]);
      setTotalPages(0);
      setTotalItems(0); // Reset totalItems on error
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedTags, currentPage]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
    setCurrentPage(1); // Reset to first page on new tag selection
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-white">Discover AI Tools</h1>

      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:flex-grow">
          <SearchBar onSearch={handleSearch} initialValue={searchTerm} />
        </div>
        <div className="w-full md:w-auto">
          <TagFilter tags={tags} selectedTags={selectedTags} onTagToggle={handleTagToggle} />
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      
      {!isLoading && !error && tools.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
          <p className="text-xl">No tools found matching your criteria.</p>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      {!isLoading && !error && tools.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {tools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={ITEMS_PER_PAGE} // Added itemsPerPage prop
              totalItems={totalItems} // Added totalItems prop
            />
          )}
        </>
      )}
    </div>
  );
}