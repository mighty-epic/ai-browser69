// src/app/(admin)/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon, CogIcon, TagIcon, UsersIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const AdminDashboardCard = ({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}) => (
  <Link href={href} className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out">
    <div className="flex items-center mb-3">
      <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
    </div>
    <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
    <div className="flex items-center text-blue-600 dark:text-blue-400 hover:underline">
      Go to {title}
      <ArrowRightIcon className="ml-2 h-4 w-4" />
    </div>
  </Link>
);

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
          Manage your application settings, content, and users.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminDashboardCard 
          title="Manage Tools"
          description="View, edit, approve, or delete tool submissions."
          href="/admin/tools"
          icon={CogIcon}
        />
        <AdminDashboardCard 
          title="Manage Tags"
          description="Create, edit, or delete tags for tool categorization."
          href="/admin/tags"
          icon={TagIcon}
        />
        <AdminDashboardCard 
          title="User Management"
          description="View and manage user accounts and roles."
          href="/admin/users"
          icon={UsersIcon}
        />
        <AdminDashboardCard 
          title="Content Requests"
          description="Review and manage tool submission requests from users."
          href="/admin/requests"
          icon={DocumentTextIcon}
        />
        {/* Add more cards for other admin sections as needed */}
      </div>

      {/* You can add more sections here, like quick stats or recent activity */}
      {/* 
      <section className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">120</p>
            <p className="text-gray-500 dark:text-gray-400">Total Tools</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-500">15</p>
            <p className="text-gray-500 dark:text-gray-400">Pending Approvals</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-500">50</p>
            <p className="text-gray-500 dark:text-gray-400">Total Tags</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-500">250</p>
            <p className="text-gray-500 dark:text-gray-400">Registered Users</p>
          </div>
        </div>
      </section>
      */}
    </div>
  );
}