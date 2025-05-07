// src/app/admin/requests/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Request as ToolRequest } from '@/types'; // Renaming to avoid conflict with Fetch API's Request
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Pagination from '@/components/Pagination';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useRouter } from 'next/navigation'; // Import useRouter for redirection

const ITEMS_PER_PAGE = 10;
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL; // Get admin email from env

const AdminRequestsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false); // For approve/deny actions

  const fetchRequests = useCallback(async (page = 1, status: string = 'all') => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/requests/admin?page=${page}&limit=${ITEMS_PER_PAGE}`;
      if (status !== 'all') {
        url += `&status=${status}`;
      }
      
      // No longer sending adminKey in headers, API will use session cookie
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch requests');
      }
      const data = await response.json();
      setRequests(data.requests || []); 
      // Assuming API returns { requests: [], total: number, page: number, limit: number }
      // For pagination, we'd use data.total and data.limit if API provides it for totalPages calculation
      // For now, client-side pagination based on fetched `requests` length if total not available.
      // This might be inaccurate if API itself paginates and doesn't return all items for a status.
      // A more robust solution would use the `total` from API response for `totalPages`.
    } catch (err: any) {
      setError(err.message);
      setRequests([]); // Clear requests on error
    }
    setIsLoading(false);
  }, [ADMIN_EMAIL]);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to load

    if (!user) {
      router.push('/login?message=Please login to access admin pages.');
      return;
    }
    if (user.email !== ADMIN_EMAIL) {
      setError('Access Denied: You are not authorized to view this page.');
      setIsLoading(false);
      setRequests([]);
      return;
    }

    fetchRequests(currentPage, statusFilter);
  }, [currentPage, statusFilter, user, authLoading, router, fetchRequests]);

  const handleStatusChange = (newStatus: 'all' | 'pending' | 'approved' | 'denied') => {
    setStatusFilter(newStatus);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: 'approved' | 'denied') => {
    if (!user || user.email !== ADMIN_EMAIL || !confirm(`Are you sure you want to ${newStatus} this request?`)) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/requests/admin/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Authorization header no longer needed, API uses session cookie
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${newStatus} request`);
      }
      // Refresh requests list
      fetchRequests(currentPage, statusFilter);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client-side pagination for simplicity if API doesn't give total for current filter
  // This is a fallback; ideally, API provides total count for the current filter.
  const filteredRequests = requests; // Already filtered by API if statusFilter is not 'all'
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  // If API provides total: const totalPages = Math.ceil(data.total / ITEMS_PER_PAGE);
  
  const paginatedRequests = filteredRequests.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  if (authLoading || isLoading) return <LoadingSpinner text="Loading requests..." className="mt-10" />;
  
  // Handle unauthorized access first
  if (error && (error.startsWith('Access Denied') || error.startsWith('Admin key not found'))) {
    return <ErrorMessage message={error} title="Authorization Error" />;
  }
  
  // Error specific to initial load or major issues after authorization check
  if (error && requests.length === 0) return <ErrorMessage message={error} title="Error loading requests" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Tool Requests</h1>
        <div className="flex items-center space-x-2">
          <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by status:</label>
          <select 
            id="statusFilter" 
            value={statusFilter} 
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
        </div>
      </div>

      {/* Display general error messages here if they occurred during an action */}
      {error && <ErrorMessage message={error} title="Action Error" />}

      {requests.length === 0 && !isLoading ? (
        <p className="text-gray-600 dark:text-gray-400">No requests found matching the current filter.</p>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tool Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">URL</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Requested At</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedRequests.map(request => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{request.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <a href={request.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-xs block">{request.url}</a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(request.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 
                          request.status === 'denied' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' : 
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'}
                      `}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {request.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateRequestStatus(request.id, 'approved')} 
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateRequestStatus(request.id, 'denied')} 
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            Deny
                          </button>
                        </>
                      )}
                      {request.status !== 'pending' && <span className="text-gray-400 dark:text-gray-500">Processed</span>}
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
    </div>
  );
};

export default AdminRequestsPage;