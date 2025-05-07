// src/app/(admin)/layout.tsx
'use client'; // Required for hooks like useEffect, useRouter, useAuth

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner'; // Assuming a LoadingSpinner component exists
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // If authentication is still loading, do nothing yet.
    if (authLoading) return;

    // If not loading and no user, redirect to login.
    if (!user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // While loading or if no user (before redirect happens), show loading spinner.
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  // If user is authenticated, render the admin layout.
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <AdminHeader />
      <div className="flex flex-1 pt-16"> {/* Adjust pt-16 based on AdminHeader height */}
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}