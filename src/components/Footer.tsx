// src/components/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          &copy; {currentYear} AI Browser. All rights reserved.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {/* Optional: Add links to privacy policy, terms of service, etc. */}
          {/* Example: <a href="/privacy" className="hover:underline">Privacy Policy</a> */}
        </p>
      </div>
    </footer>
  );
};

export default Footer;