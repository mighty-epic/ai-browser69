// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Improves font loading performance
});

export const metadata: Metadata = {
  title: {
    default: 'AI Tool Browser',
    template: '%s | AI Tool Browser',
  },
  description: 'Discover and explore a curated directory of AI tools and resources. Find the best AI solutions for your projects and tasks.',
  keywords: ['AI tools', 'artificial intelligence', 'machine learning', 'AI directory', 'software', 'SaaS', 'productivity tools'],
  // Add more metadata as needed, e.g., Open Graph, Twitter cards, icons
  // icons: {
  //   icon: '/favicon.ico',
  //   apple: '/apple-touch-icon.png',
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased selection:bg-blue-500 selection:text-white`}
        suppressHydrationWarning={true} // Add suppressHydrationWarning here as well
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <Header />
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
