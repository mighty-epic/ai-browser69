// src/app/admin/tools/page.tsx
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { ToolWithTags, Tag } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 10;

interface ToolFormData {
  id?: string;
  name: string;
  url: string;
  description: string;
  tags: string; // Comma-separated string of tag names
}

const AdminToolsPage: React.FC = () => {
  const [tools, setTools] = useState<ToolWithTags[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]); // For tag suggestions/management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolFormData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adminKey = typeof window !== 'undefined' ? localStorage.getItem('ADMIN_KEY_BROWSER') : '';

  const fetchToolsAndTags = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [toolsResponse, tagsResponse] = await Promise.all([
        fetch('/api/tools'), // Assuming this endpoint fetches all tools for admin
        fetch('/api/tags') // Assuming an endpoint to fetch all available tags
      ]);

      if (!toolsResponse.ok) {
        const errData = await toolsResponse.json();
        throw new Error(errData.error || 'Failed to fetch tools');
      }
      const toolsData: ToolWithTags[] = await toolsResponse.json();
      setTools(toolsData.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      if (tagsResponse.ok) {
        const tagsData: Tag[] = await tagsResponse.json();
        setAllTags(tagsData);
      } else {
        console.warn('Could not fetch all tags.');
      }

    } catch (err: any) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchToolsAndTags();
  }, []);

  const openModal = (tool: ToolWithTags | null = null) => {
    if (tool) {
      setCurrentTool({
        id: tool.id,
        name: tool.name,
        url: tool.url,
        description: tool.description || '',
        tags: tool.tags.map(t => t.name).join(', '),
      });
    } else {
      setCurrentTool({ name: '', url: '', description: '', tags: '' });
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTool(null);
    setFormError(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (currentTool) {
      setCurrentTool({ ...currentTool, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentTool || !adminKey) return;
    
    setFormError(null);
    setIsSubmitting(true);

    const method = currentTool.id ? 'PUT' : 'POST';
    const endpoint = currentTool.id ? `/api/tools/admin/${currentTool.id}` : '/api/tools/admin';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`,
        },
        body: JSON.stringify({
            name: currentTool.name,
            url: currentTool.url,
            description: currentTool.description,
            tags: currentTool.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${currentTool.id ? 'update' : 'create'} tool`);
      }

      fetchToolsAndTags(); // Refresh list
      closeModal();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (toolId: string) => {
    if (!adminKey || !confirm('Are you sure you want to delete this tool?')) return;

    setIsSubmitting(true); // Use for delete operation as well
    try {
      const response = await fetch(`/api/tools/admin/${toolId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete tool');
      }
      fetchToolsAndTags(); // Refresh list
    } catch (err: any) {
      setError(err.message); // Show error at page level for delete
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const paginatedTools = tools.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(tools.length / ITEMS_PER_PAGE);

  if (isLoading) return <LoadingSpinner text="Loading tools..." className="mt-10" />;
  if (error) return <ErrorMessage message={error} title="Error loading tools" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Tools</h1>
        <button 
          onClick={() => openModal()} 
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out"
        >
          Add New Tool
        </button>
      </div>

      {tools.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No tools found. Add one to get started!</p>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">URL</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tags</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created At</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedTools.map(tool => (
                  <tr key={tool.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tool.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-xs block">{tool.url}</a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tool.tags.map(t => t.name).join(', ') || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(tool.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => openModal(tool)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Edit</button>
                      <button onClick={() => handleDelete(tool.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200" disabled={isSubmitting}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </>
      )}

      {/* Modal for Add/Edit Tool */} 
      {isModalOpen && currentTool && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 w-full max-w-lg p-6 sm:p-8 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-700">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">{currentTool.id ? 'Edit' : 'Add New'} Tool</h2>
            {formError && <ErrorMessage message={formError} title="Form Error" className="mb-4"/>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" id="name" value={currentTool.name} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL <span className="text-red-500">*</span></label>
                <input type="url" name="url" id="url" value={currentTool.url} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea name="description" id="description" value={currentTool.description} onChange={handleFormChange} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"></textarea>
              </div>
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma-separated)</label>
                <input type="text" name="tags" id="tags" value={currentTool.tags} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                {allTags.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Available: {allTags.map(t => t.name).slice(0,10).join(', ')}{allTags.length > 10 ? '...' : ''}
                    </p>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : (currentTool.id ? 'Update Tool' : 'Add Tool')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminToolsPage;