// src/components/admin/AdminHeader.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SunIcon, MoonIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline'; // Changed ArrowLeftOnRectangleIcon to ArrowRightOnRectangleIcon
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth hook
import { useRouter } from 'next/navigation'; // For redirecting after logout

const AdminHeader = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth(); // Get user, signOut, and authLoading from AuthContext

  useEffect(() => {
    setMounted(true);
    // Check Supabase auth state if implemented
    // const { data: { session } } = await supabase.auth.getSession();
    // setUser(session?.user ?? null);
    // supabase.auth.onAuthStateChange((_event, session) => {
    //   setUser(session?.user ?? null);
    // });
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/login'); // Redirect to login page after admin logout
  };

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 shadow-md h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center">
        {/* Mobile menu button - to be implemented with sidebar toggle */}
        {/* <button className="md:hidden mr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <Bars3Icon className="h-6 w-6" />
        </button> */}
        <Link href="/admin" className="flex items-center">
          <img src="/logo.svg" alt="Site Logo" className="h-8 w-auto mr-2" /> {/* Replace with actual logo */}
          <span className="text-xl font-semibold text-gray-900 dark:text-white">Admin Panel</span>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggler */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <SunIcon className="h-6 w-6" />
          ) : (
            <MoonIcon className="h-6 w-6" />
          )}
        </button>

        {/* User Info and Logout */}
        <div className="flex items-center space-x-2">
          {authLoading ? (
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div> /* Loading Skeleton */
          ) : user ? (
            <>
              <UserCircleIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                {user.email}
              </span>
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                aria-label="Logout"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Login
            </Link>
          )}
        </div>

        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          View Site
        </Link>
      </div>
    </header>
  );
};

export default AdminHeader;