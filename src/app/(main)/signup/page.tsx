// src/app/(main)/signup/page.tsx
'use client';

import React from 'react';
import SignupForm from '@/components/auth/SignupForm';
import Link from 'next/link';

const SignupPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          {/* You can add a logo here if you have one */}
          {/* <img className="mx-auto h-12 w-auto" src="/logo.svg" alt="Your Company" /> */}
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
};

export default SignupPage;