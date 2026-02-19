'use client';

import { Task } from '@/lib/types';
import { isSameDay, format, parseISO } from 'date-fns';
import { PriorityBadge } from '@/components/task/PriorityBadge';
import { COLUMN_LABELS } from '@/lib/types';
import { isOverdue } from '@/lib/utils';

interface DailyViewProps {
  tasks: Task[];
  currentDate: Date;
  onTaskClick: (task: Task) => void;
}

export function DailyView({ tasks, currentDate, onTaskClick }: DailyViewProps) {
  const dayTasks = tasks.filter(
    (task) => task.dueDate !== null && isSameDay(parseISO(task.dueDate), currentDate)
  );

  if (dayTasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No tasks due on this day
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {dayTasks.map((task) => {
        const overdue = isOverdue(task);
        const dueDate = parseISO(task.dueDate!);
        const hasTime = dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0;

        return (
          <div
            key={task.id}
            onClick={() => onTaskClick(task)}
            className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer hover:shadow-md ${
              overdue ? 'ring-2 ring-red-300' : ''
            }`}
          >
            {/* Top row: Priority and Status */}
            <div className="flex items-center justify-between mb-2">
              <PriorityBadge priority={task.priority} />
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {COLUMN_LABELS[task.status]}
              </span>
            </div>

            {/* Title */}
            <div className="text-lg font-semibold mb-1">{task.title}</div>

            {/* Note */}
            {task.note && (
              <div className="text-sm text-gray-500 italic mt-1">{task.note}</div>
            )}

            {/* Description */}
            {task.description && (
              <div className="text-sm text-gray-600 mt-2 line-clamp-3">{task.description}</div>
            )}

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {task.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Due time */}
            {hasTime && (
              <div className="text-xs text-gray-500 mt-2">
                Due: {format(dueDate, 'h:mm a')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
