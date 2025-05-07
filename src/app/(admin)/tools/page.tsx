// src/app/(admin)/tools/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Ensure this path is correct
import { Tool, Tag } from '@/types'; // Ensure this path is correct
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Pagination from '@/components/Pagination'; // Ensure this path is correct
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Define a more specific type for tools in the admin panel, including status
interface AdminTool extends Tool {
  status: 'pending' | 'approved' | 'rejected'; // Example statuses
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

const ITEMS_PER_PAGE = 10;

export default function AdminToolsPage() {
  const [tools, setTools] = useState<AdminTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // TODO: Add states for search, filtering by status, tags, etc.
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchTools = useCallback(async (page: number, search: string, status: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Adjust API endpoint or Supabase query for admin-specific tool fetching
      // This might involve fetching tools with their submission status
      let query = supabase
        .from('tools') // Assuming 'tools' table has a 'status' column
        .select('*, tags(id, name)', { count: 'exact' })
        .order('submitted_at', { ascending: false }); // Or by name, status, etc.

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error: dbError, count } = await query.range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (dbError) throw dbError;
      
      setTools(data as AdminTool[] || []);
      setTotalItems(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      setCurrentPage(page);

    } catch (err: any) {
      console.error('Error fetching tools:', err);
      setError(err.message || 'Failed to fetch tools. Check console for details.');
      setTools([]); // Clear tools on error
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTools(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter, fetchTools]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleApproveTool = async (toolId: string) => {
    // Implement Supabase update to change tool status to 'approved'
    setIsLoading(true);
    const { error: updateError } = await supabase
      .from('tools')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', toolId);
    setIsLoading(false);
    if (updateError) {
      setError(`Failed to approve tool: ${updateError.message}`);
    } else {
      fetchTools(currentPage, searchTerm, statusFilter); // Refresh list
    }
  };

  const handleRejectTool = async (toolId: string) => {
    // Implement Supabase update to change tool status to 'rejected'
    // Optionally, prompt for a rejection reason
    const reason = prompt('Enter reason for rejection (optional):');
    setIsLoading(true);
    const { error: updateError } = await supabase
      .from('tools')
      .update({ status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: reason })
      .eq('id', toolId);
    setIsLoading(false);
    if (updateError) {
      setError(`Failed to reject tool: ${updateError.message}`);
    } else {
      fetchTools(currentPage, searchTerm, statusFilter); // Refresh list
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (confirm('Are you sure you want to delete this tool permanently?')) {
      setIsLoading(true);
      const { error: deleteError } = await supabase
        .from('tools')
        .delete()
        .eq('id', toolId);
      setIsLoading(false);
      if (deleteError) {
        setError(`Failed to delete tool: ${deleteError.message}`);
      } else {
        fetchTools(currentPage, searchTerm, statusFilter); // Refresh list
      }
    }
  };

  // TODO: Implement handleEditTool to navigate to an edit page or open a modal
  const handleEditTool = (toolId: string) => {
    alert(`Edit functionality for tool ${toolId} to be implemented.`);
    // Example: router.push(`/admin/tools/edit/${toolId}`);
  };
  
  // TODO: Implement handleAddTool to navigate to an add page or open a modal
  const handleAddTool = () => {
    alert('Add new tool functionality to be implemented.');
    // Example: router.push('/admin/tools/new');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Manage Tools</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">View, approve, edit, or delete tool submissions.</p>
        </div>
        <button 
          onClick={handleAddTool}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add New Tool
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input 
            type="text"
            placeholder="Search tools by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading && <LoadingSpinner text="Loading tools..." className="mt-6" />}
      {error && <ErrorMessage message={error} title="Error Loading Tools" className="mt-6" />}

      {!isLoading && !error && tools.length === 0 && (
        <div className="text-center py-10 mt-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-xl text-gray-600 dark:text-gray-400">No tools found.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Try adjusting your search or filters, or add a new tool.</p>
        </div>
      )}

      {!isLoading && !error && tools.length > 0 && (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Submitted</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tools.map((tool) => (
                <tr key={tool.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{tool.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{tool.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${tool.status === 'approved' ? 'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100' : 
                        tool.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100' : 
                        'bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100'}
                    `}>
                      {tool.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {tool.submitted_at ? new Date(tool.submitted_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {tool.status === 'pending' && (
                      <>
                        <button onClick={() => handleApproveTool(tool.id)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" title="Approve">
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleRejectTool(tool.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Reject">
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleEditTool(tool.id)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="Edit">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteTool(tool.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Delete">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={handlePageChange} 
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={totalItems}
        />
      )}
    </div>
  );
}