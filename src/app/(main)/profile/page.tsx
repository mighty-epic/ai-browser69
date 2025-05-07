// src/app/(main)/profile/page.tsx
'use client';

import React, { useEffect } from 'react';
import UserProfile from '@/components/auth/UserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login'); // Redirect to login if not authenticated
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    // Show a loading spinner or a minimal layout while checking auth/redirecting
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size={12} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <UserProfile />
      </div>
    </div>
  );
};

export default ProfilePage;