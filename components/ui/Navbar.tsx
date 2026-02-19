'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationBadge } from './NotificationBadge';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-900">Task Manager</div>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`${
              pathname === '/'
                ? 'text-blue-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            } transition-colors`}
          >
            Board
          </Link>
          <Link
            href="/calendar"
            className={`${
              pathname === '/calendar'
                ? 'text-blue-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            } transition-colors`}
          >
            Calendar
          </Link>
          <Link
            href="/reports"
            className={`${
              pathname === '/reports'
                ? 'text-blue-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            } transition-colors`}
          >
            Reports
          </Link>
        </div>
        <div>
          <NotificationBadge />
        </div>
      </div>
    </nav>
  );
}
