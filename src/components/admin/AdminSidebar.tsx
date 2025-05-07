// src/components/admin/AdminSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  CogIcon, // Tools
  TagIcon, // Tags
  UsersIcon, // Users
  DocumentTextIcon, // Requests / Submissions
  // Add other icons as needed, e.g., ChartBarIcon for Analytics, ShieldCheckIcon for Security
} from '@heroicons/react/24/outline';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: HomeIcon,
  },
  {
    href: '/admin/tools',
    label: 'Manage Tools',
    icon: CogIcon,
  },
  {
    href: '/admin/tags',
    label: 'Manage Tags',
    icon: TagIcon,
  },
  {
    href: '/admin/requests',
    label: 'Tool Requests',
    icon: DocumentTextIcon,
  },
  {
    href: '/admin/users',
    label: 'User Management',
    icon: UsersIcon,
  },
  // Add more navigation items here, for example:
  // {
  //   href: '/admin/analytics',
  //   label: 'Analytics',
  //   icon: ChartBarIcon,
  // },
  // {
  //   href: '/admin/settings',
  //   label: 'Settings',
  //   icon: AdjustmentsHorizontalIcon, // Or another CogIcon variant
  // },
];

const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0 hidden md:block">
      <div className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`
                flex items-center px-3 py-2.5 rounded-lg transition-colors duration-150 ease-in-out
                ${isActive
                  ? 'bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-100 font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive ? '' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}`} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default AdminSidebar;