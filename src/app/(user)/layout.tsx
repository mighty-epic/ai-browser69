// src/app/(user)/layout.tsx
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
// import { ThemeProvider } from 'next-themes'; // If you're using next-themes for dark mode

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
      </div>
    // </ThemeProvider>
  );
}