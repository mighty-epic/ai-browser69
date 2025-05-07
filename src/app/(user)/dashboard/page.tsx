// src/app/(user)/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ToolCard from '@/components/ToolCard';
import SearchBar from '@/components/SearchBar';
import TagFilter from '@/components/TagFilter';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import RequestModal from '@/components/RequestModal'; // For submitting new tools
import { ToolWithTags, Tag, PaginatedResponse } from '@/types'; // Changed import path and type
import { PlusCircleIcon } from '@heroicons/react/24/outline';

const ITEMS_PER_PAGE = 12;

export default function HomePage() {
  const [tools, setTools] = useState<ToolWithTags[]>([]); // Changed to ToolWithTags[]
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // Store tag IDs or names
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  const fetchTools = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(`/api/tools?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch tools');
      }
      const data: PaginatedResponse<ToolWithTags> = await response.json(); // Changed to PaginatedResponse<ToolWithTags>
      setTools(data.items); // Assuming API returns items in PaginatedResponse
      setTotalPages(data.totalPages);
      setTotalItems(data.total); // Corrected: was data.totalItems
      setCurrentPage(data.page); // Corrected: was data.currentPage
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setTools([]); // Clear tools on error
    }
    setIsLoading(false);
  }, [searchTerm, selectedTags, currentPage]);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      const data = await response.json(); // Assuming API returns Tag[] directly or {tags: Tag[]}
      setTags(data.tags || data); // Adjust based on actual API response for tags
    } catch (err: any) {
      console.error('Error fetching tags:', err);
      // setError(err.message); // Optionally set error for tags as well
      setTags([]);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]); // Dependencies: searchTerm, selectedTags, currentPage (via fetchTools useCallback)

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
    setCurrentPage(1); // Reset to first page on tag change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">AI Tool Directory</h1>
        <button 
          onClick={() => setIsRequestModalOpen(true)}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Suggest a Tool
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="md:col-span-2">
          <SearchBar onSearch={handleSearch} />
        </div>
        <div className="md:col-span-1">
          <TagFilter tags={tags} selectedTags={selectedTags} onTagToggle={handleTagToggle} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="Loading tools..." />
        </div>
      ) : error ? (
        <ErrorMessage title="Error Fetching Tools" message={error} />
      ) : tools.length === 0 ? (
        <div className="text-center py-10">
            <p className="text-xl text-gray-600 dark:text-gray-400">No tools found matching your criteria.</p>
            {(searchTerm || selectedTags.length > 0) && (
                <button 
                    onClick={() => { 
                        setSearchTerm(''); 
                        setSelectedTags([]); 
                        setCurrentPage(1); 
                    }}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                    Clear Filters
                </button>
            )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={totalItems}
              />
            </div>
          )}
        </>
      )}
      <RequestModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
        onSubmitSuccess={() => { // Changed 'onSuccess' to 'onSubmitSuccess'
            setIsRequestModalOpen(false); 
            fetchTools(); // Refetch tools on successful submission
        }}
      />
    </div>
  );
}