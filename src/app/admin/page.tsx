// src/app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

interface ToolRequest {
  id: string;
  name: string;
  url: string;
  description: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

const AdminPage: React.FC = () => {
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/requests');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tool requests.');
      }
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    // Placeholder for approve logic
    // In a real app, this would send a request to an API endpoint to update the status
    // and potentially move the tool to the main 'tools' table.
    console.log(`Approving request ${id}`);
    alert(`Request ${id} approved (simulated).`);
    // Example: Update local state or re-fetch
    setRequests(prevRequests => 
      prevRequests.map(req => req.id === id ? { ...req, status: 'approved' } : req)
    );
    // In a real app, you'd likely call an API to update the backend:
    // try {
    //   const response = await fetch(`/api/requests/${id}/approve`, { method: 'PATCH' });
    //   if (!response.ok) throw new Error('Failed to approve');
    //   fetchRequests(); // Re-fetch to update the list
    // } catch (err) { console.error(err); alert('Failed to approve request.'); }
  };

  const handleReject = async (id: string) => {
    // Placeholder for reject logic
    console.log(`Rejecting request ${id}`);
    alert(`Request ${id} rejected (simulated).`);
    setRequests(prevRequests => 
      prevRequests.map(req => req.id === id ? { ...req, status: 'rejected' } : req)
    );
    // In a real app, you'd likely call an API to update the backend:
    // try {
    //   const response = await fetch(`/api/requests/${id}/reject`, { method: 'PATCH' });
    //   if (!response.ok) throw new Error('Failed to reject');
    //   fetchRequests(); // Re-fetch to update the list
    // } catch (err) { console.error(err); alert('Failed to reject request.'); }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner text="Loading requests..." /></div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8"><ErrorMessage title="Error Loading Requests" message={error} onRetry={fetchRequests} /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100">Admin - Tool Requests</h1>
      
      {requests.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No pending tool requests found.</p>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 break-all">{request.name}</h2>
                <span 
                  className={`text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap
                    ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                      'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}
                  `}
                >
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2 break-all">
                <strong>URL:</strong> <a href={request.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{request.url}</a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Description:</strong> {request.description}
              </p>
              {request.tags && request.tags.length > 0 && (
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Tags:</strong> {request.tags.join(', ')}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Submitted: {new Date(request.submittedAt).toLocaleString()}
              </p>
              
              {request.status === 'pending' && (
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => handleApprove(request.id)} 
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition-colors"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(request.id)} 
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;