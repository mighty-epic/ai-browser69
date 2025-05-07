// src/app/(admin)/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '@/lib/supabaseClient'; // If using Supabase for auth users
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Pagination from '@/components/Pagination';
import { UserPlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

// This would typically come from Supabase Auth or your user management system
interface AdminUser {
  id: string;
  email: string | undefined;
  role: 'admin' | 'user' | 'editor'; // Example roles
  created_at: string;
  last_sign_in_at?: string;
  // Add other relevant user fields
}

const ITEMS_PER_PAGE = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Placeholder: User management is complex and depends heavily on auth provider (e.g., Supabase Auth)
  // For a real implementation, you'd fetch users from `supabase.auth.admin.listUsers()` (requires admin privileges)
  // or a dedicated 'profiles' table linked to auth users.

  const fetchUsers = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    // --- BEGIN DEMO DATA --- 
    // This is placeholder data. Replace with actual Supabase call.
    const demoUsers: AdminUser[] = [
      { id: '1', email: 'admin@example.com', role: 'admin', created_at: new Date().toISOString(), last_sign_in_at: new Date().toISOString() },
      { id: '2', email: 'editor@example.com', role: 'editor', created_at: new Date().toISOString(), last_sign_in_at: new Date().toISOString() },
      { id: '3', email: 'user1@example.com', role: 'user', created_at: new Date().toISOString(), last_sign_in_at: new Date().toISOString() },
      { id: '4', email: 'user2@example.com', role: 'user', created_at: new Date().toISOString(), last_sign_in_at: new Date().toISOString() },
    ];
    setUsers(demoUsers);
    setTotalItems(demoUsers.length);
    setTotalPages(Math.ceil(demoUsers.length / ITEMS_PER_PAGE));
    setCurrentPage(page);
    // --- END DEMO DATA ---
    setIsLoading(false);
    // setError('User management functionality is not fully implemented in this demo.');
    /*
    // Example of how you might fetch users with Supabase (server-side or admin-privileged client-side)
    try {
      // const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers({
      //   page: page,
      //   perPage: ITEMS_PER_PAGE,
      // });
      // if (listError) throw listError;

      // const fetchedUsers = authUsers.map(u => ({
      //   id: u.id,
      //   email: u.email,
      //   role: u.user_metadata?.role || 'user', // Assuming role is in user_metadata
      //   created_at: u.created_at,
      //   last_sign_in_at: u.last_sign_in_at,
      // }));
      // setUsers(fetchedUsers);
      // const total = (await supabase.auth.admin.listUsers()).data.users.length; // Simplified total count
      // setTotalItems(total);
      // setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
      // setCurrentPage(page);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users. This often requires admin privileges.');
      setUsers([]);
    }
    setIsLoading(false);
    */
  }, []);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddUser = () => {
    alert('Add user functionality (e.g., inviting user) to be implemented.');
    // This would typically involve inviting a user via email using supabase.auth.admin.inviteUserByEmail()
  };

  const handleEditUserRole = (userId: string, currentRole: string) => {
    const newRole = prompt(`Enter new role for user ${userId} (current: ${currentRole}):`, currentRole);
    if (newRole && newRole !== currentRole) {
      alert(`Role change for user ${userId} to ${newRole} to be implemented.`);
      // Implement Supabase update: supabase.auth.admin.updateUserById(userId, { user_metadata: { role: newRole } })
      // Then refresh users: fetchUsers(currentPage);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm(`Are you sure you want to delete user ${userId}? This action is irreversible.`)) {
      alert(`Delete user ${userId} functionality to be implemented.`);
      // Implement Supabase delete: supabase.auth.admin.deleteUser(userId)
      // Then refresh users: fetchUsers(currentPage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">View and manage user accounts and roles.</p>
        </div>
        <button 
          onClick={handleAddUser}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
        >
          <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add New User / Invite
        </button>
      </div>

      {/* Placeholder for search and filters */}
      {/* <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <input type="text" placeholder="Search users by email..." className="w-full ..." />
      </div> */}

      {isLoading && <LoadingSpinner text="Loading users..." className="mt-6" />}
      {error && <ErrorMessage message={error} title="Error Loading Users" className="mt-6" />}

      {!isLoading && !error && users.length === 0 && (
        <div className="text-center py-10 mt-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-xl text-gray-600 dark:text-gray-400">No users found.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">User management functionality is currently using placeholder data or is not fully set up.</p>
        </div>
      )}

      {!isLoading && !error && users.length > 0 && (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Created At</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Last Sign In</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.role === 'admin' ? 'bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100' : 
                        user.role === 'editor' ? 'bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100' : 
                        'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100'}
                    `}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleEditUserRole(user.id, user.role)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="Edit Role">
                      <ShieldCheckIcon className="h-5 w-5" />
                    </button>
                    {/* <button onClick={() => alert('Edit user details to be implemented')} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="Edit User Details">
                      <PencilIcon className="h-5 w-5" />
                    </button> */}
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Delete User">
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
      
      {!isLoading && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-md">
            <p className="text-sm text-yellow-700 dark:text-yellow-200">
              <strong>Note:</strong> Full user management (fetching real users, role changes, deletion) requires Supabase Admin SDK integration, typically on a secure backend or serverless function, or specific client-side admin privileges. This page currently uses placeholder data and simulated actions.
            </p>
          </div>
      )}
    </div>
  );
}