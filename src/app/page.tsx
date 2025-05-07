// src/app/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)] text-center px-4 py-12 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Welcome to <span className="text-blue-600 dark:text-blue-400">AI Tool Browser</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          Your one-stop directory to discover, explore, and compare the latest and greatest Artificial Intelligence tools and resources.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link 
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-150 ease-in-out transform hover:scale-105"
          >
            Explore Tools
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
          {/* Optional: Add a secondary call to action, e.g., for submitting a tool */}
          {/* 
          <Link 
            href="/submit-tool" // Or trigger modal if preferred
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-blue-600 dark:border-blue-400 text-base font-medium rounded-lg text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out transform hover:scale-105"
          >
            Suggest a Tool
          </Link>
          */}
        </div>
        
        <div className="mt-16 text-left max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Why AI Tool Browser?</h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    <span><strong>Curated Directory:</strong> Access a handpicked list of relevant and up-to-date AI tools.</span>
                </li>
                <li className="flex items-start">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    <span><strong>Easy Search & Filter:</strong> Quickly find what you need with powerful search and tag-based filtering.</span>
                </li>
                <li className="flex items-start">
                    <svg className="flex-shrink-0 h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    <span><strong>Community Driven:</strong> Suggest new tools and help grow the directory for everyone.</span>
                </li>
            </ul>
        </div>

      </main>
    </div>
  );
}
