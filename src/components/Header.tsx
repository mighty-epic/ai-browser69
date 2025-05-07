// src/components/Header.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { MoonIcon, SunIcon, PlusCircleIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import RequestModal from './RequestModal'; // Import the modal component
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth hook
import Link from 'next/link'; // Added missing Link import

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(false); // Note: This line in new_str uses isDarkMode, while original used darkMode. Assuming this is an intended change by the replace block.
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const { setTheme } = useTheme(); // This line was in the original erroneous search block, but not in the corrected one or the original content. The replace block adds it.
  const { user, signOut, loading: authLoading } = useAuth(); // Get user and signOut from AuthContext
  const [mounted, setMounted] = useState(false); // Added missing mounted state

  useEffect(() => {
    setMounted(true);
    // Check local storage or system preference for initial dark mode state
    const isDark = localStorage.getItem('darkMode') === 'true' || 
                   (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', String(newMode));
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  if (!mounted) {
    // Avoid hydration mismatch by rendering a placeholder or null until mounted
    // This placeholder should roughly match the final layout to prevent CLS
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div> {/* Placeholder for Logo/Title */}
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div> {/* Placeholder for Home link */}
                        <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div> {/* Placeholder for Admin link */}
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div> {/* Placeholder for Theme toggle */}
                    </div>
                </div>
            </div>
        </header>
    );
  }

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                AI Browser
            </Link>
          </div>
<nav className="flex items-center space-x-2 sm:space-x-4">
                <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Home
                </Link>

                {user && (
                  <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Admin
                  </Link>
                )}

                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none"
                  aria-label="Submit a new tool"
                >
                  <PlusCircleIcon className="h-5 w-5 md:mr-1" />
                  <span className="hidden md:inline">Submit Tool</span>
                </button>

                {!authLoading && user ? (
                  <>
                    <span className="hidden sm:flex items-center text-sm text-gray-700 dark:text-gray-300 px-2 sm:px-3 py-2">
                      <UserCircleIcon className="h-5 w-5 mr-1 text-gray-500 dark:text-gray-400"/> 
                      {user.email}
                    </span>
                    <Link href="/profile" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      Profile
                    </Link>
                    <button
                      onClick={async () => {
                        await signOut();
                        // router.push('/'); // Optionally redirect after logout
                      }}
                      className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none"
                      aria-label="Logout"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 md:mr-1" />
                      <span className="hidden md:inline">Logout</span>
                    </button>
                  </>
                ) : !authLoading && (
                  <>
                    <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      Login
                    </Link>
                    <Link href="/signup" className="text-gray-700 dark:text-gray-300 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white dark:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      Sign Up
                    </Link>
                  </>
                )}
                 {authLoading && <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>} {/* Loading Skeleton */}
              </nav>
            <button
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-700 focus:ring-blue-500 transition-colors"
            >
              {isDarkMode ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )}
            </button>
        </div>
      </div>
    </header>
    <RequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmitSuccess={() => setIsModalOpen(false)} />
    </>
  );
};

export default Header;