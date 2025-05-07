// src/app/(admin)/tags/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Ensure this path is correct
import { Tag } from '@/types'; // Ensure this path is correct
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface AdminTag extends Tag {
  tools_count?: number; // Optional: count of tools associated with this tag
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<AdminTag | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagIdToEdit, setTagIdToEdit] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch tags and optionally count of associated tools
      // This might require a more complex query or a view in Supabase
      const { data, error: dbError } = await supabase
        .from('tags')
        .select('id, name, created_at') // Adjust if you have tools_count or similar
        .order('name', { ascending: true });

      if (dbError) throw dbError;
      
      // If you need tools_count, you might need a separate query or a function call
      // For simplicity, we're not including it here directly from this query.
      setTags(data as AdminTag[] || []);
    } catch (err: any) {
      console.error('Error fetching tags:', err);
      setError(err.message || 'Failed to fetch tags. Check console for details.');
      setTags([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const openModalForCreate = () => {
    setEditingTag(null);
    setTagName('');
    setTagIdToEdit(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (tag: AdminTag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagIdToEdit(tag.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTag(null);
    setTagName('');
    setTagIdToEdit(null);
  };

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setError('Tag name cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      if (editingTag && tagIdToEdit) {
        // Update existing tag
        const { error: updateError } = await supabase
          .from('tags')
          .update({ name: tagName.trim() })
          .eq('id', tagIdToEdit);
        if (updateError) throw updateError;
      } else {
        // Create new tag
        // Check if tag already exists (case-insensitive)
        const { data: existingTags, error: fetchError } = await supabase
          .from('tags')
          .select('id')
          .ilike('name', tagName.trim());
        
        if (fetchError) throw fetchError;
        if (existingTags && existingTags.length > 0) {
          throw new Error(`Tag "${tagName.trim()}" already exists.`);
        }

        const { error: insertError } = await supabase
          .from('tags')
          .insert([{ name: tagName.trim() }]);
        if (insertError) throw insertError;
      }
      fetchTags(); // Refresh list
      closeModal();
    } catch (err: any) {
      console.error('Error saving tag:', err);
      setError(err.message || 'Failed to save tag.');
    }
    setIsLoading(false);
  };

  const handleDeleteTag = async (tagId: string) => {
    if (confirm('Are you sure you want to delete this tag? This might affect tools associated with it.')) {
      setIsLoading(true);
      setError(null);
      try {
        // Note: Consider how to handle tools associated with this tag.
        // Supabase might restrict deletion if there are foreign key constraints.
        // You might need to disassociate tools first or handle this via cascade settings in DB.
        const { error: deleteError } = await supabase
          .from('tags')
          .delete()
          .eq('id', tagId);
        if (deleteError) throw deleteError;
        fetchTags(); // Refresh list
      } catch (err: any) {
        console.error('Error deleting tag:', err);
        setError(err.message || 'Failed to delete tag. It might be in use by some tools.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Manage Tags</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Create, edit, or delete tags for tool categorization.</p>
        </div>
        <button 
          onClick={openModalForCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add New Tag
        </button>
      </div>

      {isLoading && !isModalOpen && <LoadingSpinner text="Loading tags..." className="mt-6" />}
      {error && <ErrorMessage message={error} title="Error Operation" className="my-4" onDismiss={() => setError(null)} />}

      {!isLoading && !error && tags.length === 0 && !isModalOpen && (
        <div className="text-center py-10 mt-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-xl text-gray-600 dark:text-gray-400">No tags found.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Click 'Add New Tag' to create one.</p>
        </div>
      )}

      {!isLoading && tags.length > 0 && !isModalOpen && (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Created At</th>
                {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tools Count</th> */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{tag.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {tag.created_at ? new Date(tag.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {tag.tools_count !== undefined ? tag.tools_count : 'N/A'}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => openModalForEdit(tag)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="Edit">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteTag(tag.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Delete">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit Tag */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingTag ? 'Edit Tag' : 'Add New Tag'}
            </h2>
            {error && <ErrorMessage message={error} title="Validation Error" className="mb-4" onDismiss={() => setError(null)} />}
            <form onSubmit={handleSaveTag} className="space-y-4">
              <div>
                <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tag Name
                </label>
                <input
                  type="text"
                  id="tagName"
                  name="tagName"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : (editingTag ? 'Save Changes' : 'Add Tag')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}