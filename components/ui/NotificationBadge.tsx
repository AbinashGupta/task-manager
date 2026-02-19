'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Task } from '@/lib/types';
import { isOverdue, isDueToday } from '@/lib/utils';

export function NotificationBadge() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const hasRequestedPermissionRef = useRef(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const allTasks = await api.tasks.list();
        setTasks(allTasks);
      } catch (error) {
        console.error('Failed to fetch tasks for notifications:', error);
      }
    };

    fetchTasks();

    // Request notification permission on mount (only once)
    if ('Notification' in window && Notification.permission === 'default' && !hasRequestedPermissionRef.current) {
      Notification.requestPermission();
      hasRequestedPermissionRef.current = true;
    }
  }, []);

  const overdueTasks = tasks.filter(task => isOverdue(task));
  const dueTodayTasks = tasks.filter(task => isDueToday(task) && !isOverdue(task));

  useEffect(() => {
    // Fire browser notification if permission granted and there are overdue tasks
    if ('Notification' in window && Notification.permission === 'granted' && overdueTasks.length > 0) {
      new Notification('Task Manager', {
        body: `You have ${overdueTasks.length} overdue task(s)`,
      });
    }
  }, [overdueTasks.length]);

  return (
    <div className="relative inline-flex">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.21 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {overdueTasks.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {overdueTasks.length}
          </span>
        )}
        {overdueTasks.length === 0 && dueTodayTasks.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {dueTodayTasks.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border p-3 z-50">
            <div className="space-y-3">
              {overdueTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-700 mb-2">
                    Overdue ({overdueTasks.length})
                  </h3>
                  <ul className="space-y-1">
                    {overdueTasks.map(task => (
                      <li key={task.id} className="text-sm text-gray-700 truncate">
                        {task.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {dueTodayTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-amber-700 mb-2">
                    Due Today ({dueTodayTasks.length})
                  </h3>
                  <ul className="space-y-1">
                    {dueTodayTasks.map(task => (
                      <li key={task.id} className="text-sm text-gray-700 truncate">
                        {task.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {overdueTasks.length === 0 && dueTodayTasks.length === 0 && (
                <p className="text-sm text-gray-500">No urgent tasks</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
