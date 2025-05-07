// src/app/(admin)/requests/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Ensure this path is correct
import { Request as ToolRequest } from '@/types'; // Ensure this path is correct and alias Request
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Pagination from '@/components/Pagination'; // Ensure this path is correct
import { CheckCircleIcon, XCircleIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';

interface AdminToolRequest extends ToolRequest {
  // id, created_at, and status are inherited from ToolRequest (which is Request from types.ts)
  // user_email?: string; // If you store who submitted it
}

const ITEMS_PER_PAGE = 10;

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AdminToolRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<AdminToolRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TODO: Add states for search, filtering by status (if applicable to requests table)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending'); // Align with Request type

  const fetchRequests = useCallback(async (page: number, status: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('tool_requests') // Assuming your table is named 'tool_requests'
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error: dbError, count } = await query.range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (dbError) throw dbError;
      
      setRequests(data as AdminToolRequest[] || []);
      setTotalItems(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      setCurrentPage(page);

    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err.message || 'Failed to fetch requests. Check console for details.');
      setRequests([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests(currentPage, statusFilter);
  }, [currentPage, statusFilter, fetchRequests]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openModal = (request: AdminToolRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setIsModalOpen(false);
  };

  const handleApproveRequest = async (request: AdminToolRequest) => {
    if (!confirm("Are you sure you want to approve this tool request? This will add it to the main 'tools' table.")) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // 1. Insert into 'tools' table (adapt fields as necessary)
      const { data: newTool, error: insertError } = await supabase
        .from('tools')
        .insert({
          name: request.name,
          description: request.description,
          url: request.url,
          // logo_url: request.logo_url, // if available
          // categories: request.categories, // if available
          // pricing_type: request.pricing_type, // if available
          // platform: request.platform, // if available
          status: 'approved', // Or 'pending' if it needs further review in the main tools management
          submitted_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw new Error(`Failed to add tool: ${insertError.message}`);
      if (!newTool) throw new Error('Failed to add tool, no data returned.');

      // 2. (Optional) Add tags to tool_tags join table
      if (request.tags && request.tags.length > 0) {
        const tagObjects = request.tags.map(tagName => ({ name: tagName }));
        // Upsert tags to ensure they exist and get their IDs
        const { data: upsertedTags, error: tagsError } = await supabase
            .from('tags')
            .upsert(tagObjects, { onConflict: 'name', ignoreDuplicates: false })
            .select('id, name');

        if (tagsError) console.error('Error upserting tags:', tagsError.message); // Non-critical, proceed
        
        if (upsertedTags && upsertedTags.length > 0) {
            const toolTagRelations = upsertedTags.map(tag => ({ tool_id: newTool.id, tag_id: tag.id }));
            const { error: toolTagsError } = await supabase.from('tool_tags').insert(toolTagRelations);
            if (toolTagsError) console.error('Error linking tags to tool:', toolTagsError.message); // Non-critical
        }
      }

      // 3. Update the request status to 'processed' or delete it
      const { error: updateRequestError } = await supabase
        .from('tool_requests')
        .update({ status: 'approved' }) // Align with Request type status
        .eq('id', request.id);
      // Or delete: .delete().eq('id', request.id);

      if (updateRequestError) console.warn(`Failed to update request status: ${updateRequestError.message}`);

      alert('Tool request approved and added to the directory!');
      fetchRequests(currentPage, statusFilter); // Refresh list
      closeModal();
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError(err.message || 'Failed to approve request.');
    }
    setIsLoading(false);
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to deny this tool request?')) return; // Changed confirm message for clarity

    setIsLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('tool_requests')
        .update({ status: 'denied' }) // Align with Request type status
        .eq('id', requestId);

      if (updateError) throw updateError;
      
      alert('Tool request denied.');
      fetchRequests(currentPage, statusFilter);
      closeModal();
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError(err.message || 'Failed to reject request.');
    }
    setIsLoading(false);
  };
  
  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request permanently?')) return;
    setIsLoading(true);
    try {
        const { error: deleteError } = await supabase
            .from('tool_requests')
            .delete()
            .eq('id', requestId);
        if (deleteError) throw deleteError;
        fetchRequests(currentPage, statusFilter);
        alert('Request deleted successfully.');
    } catch (err: any) {
        setError(err.message || 'Failed to delete request.');
    }
    setIsLoading(false);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tool Submission Requests</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Review and process user-submitted tools.</p>
        </div>
        {/* Optional: Filter by status */}
        <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
      </div>

      {isLoading && <LoadingSpinner text="Loading requests..." className="mt-6" />}
      {error && <ErrorMessage message={error} title="Error Operation" className="my-4" onDismiss={() => setError(null)} />}

      {!isLoading && !error && requests.length === 0 && (
        <div className="text-center py-10 mt-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-xl text-gray-600 dark:text-gray-400">No submission requests found.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Currently, there are no pending tool submissions matching your criteria.</p>
        </div>
      )}

      {!isLoading && !error && requests.length > 0 && (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tool Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">URL</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Submitted At</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{request.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 hover:underline hidden md:table-cell">
                    <a href={request.url} target="_blank" rel="noopener noreferrer" title={request.url}>{request.url.length > 30 ? `${request.url.substring(0,30)}...` : request.url}</a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {new Date(request.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${request.status === 'approved' ? 'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100' : 
                        request.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100' : 
                        request.status === 'denied' ? 'bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100' : 
                        'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-100'}
                    `}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center">
                    <button onClick={() => openModal(request)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="View Details">
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {request.status === 'pending' && (
                      <>
                        <button onClick={() => handleApproveRequest(request)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" title="Approve Request">
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleRejectRequest(request.id)} className="text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300" title="Reject Request">
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                     <button onClick={() => handleDeleteRequest(request.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Delete Request">
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

      {/* Modal for Viewing Request Details */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tool Request Details</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <XCircleIcon className="h-6 w-6" />
                </button>
            </div>
            {error && <ErrorMessage message={error} title="Error" className="mb-4" onDismiss={() => setError(null)} />}
            <div className="space-y-3 text-sm">
              <p><strong>Name:</strong> <span className="text-gray-700 dark:text-gray-300">{selectedRequest.name}</span></p>
              <p><strong>URL:</strong> <a href={selectedRequest.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all">{selectedRequest.url}</a></p>
              <p><strong>Description:</strong> <span className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedRequest.description}</span></p>
              <p><strong>Tags:</strong> <span className="text-gray-700 dark:text-gray-300">{selectedRequest.tags?.join(', ') || 'N/A'}</span></p>
              <p><strong>Status:</strong> <span className="text-gray-700 dark:text-gray-300 capitalize">{selectedRequest.status}</span></p>
              <p><strong>Submitted At:</strong> <span className="text-gray-700 dark:text-gray-300">{new Date(selectedRequest.created_at).toLocaleString()}</span></p>
              {/* Add user email if available: <p><strong>Submitted By:</strong> {selectedRequest.user_email || 'Anonymous'}</p> */}
            </div>
            {selectedRequest.status === 'pending' && (
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                    onClick={() => handleRejectRequest(selectedRequest.id)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                    >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Reject Request'}
                    </button>
                    <button
                    onClick={() => handleApproveRequest(selectedRequest)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                    >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Approve and Add Tool'}
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}