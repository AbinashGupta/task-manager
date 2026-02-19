'use client';

import { Task, TaskStatus, getNextCaretStatus, getPreviousCaretStatus } from '@/lib/types';
import { isOverdue, isDueToday } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { PriorityBadge } from './PriorityBadge';

interface TaskCardProps {
  task: Task;
  onMove: (id: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, onMove, onEdit }: TaskCardProps) {
  // Get next/previous status skipping blocked
  const nextStatus = getNextCaretStatus(task.status);
  const previousStatus = getPreviousCaretStatus(task.status);
  
  const canMoveLeft = previousStatus !== null;
  const canMoveRight = nextStatus !== null;

  const handleMoveLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canMoveLeft && previousStatus) {
      onMove(task.id, previousStatus);
    }
  };

  const handleMoveRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canMoveRight && nextStatus) {
      onMove(task.id, nextStatus);
    }
  };

  const formatDueDate = () => {
    if (!task.dueDate) return null;
    const dueDate = parseISO(task.dueDate);
    if (isOverdue(task)) return 'Overdue';
    if (isDueToday(task)) return 'Today';
    return format(dueDate, 'MMM d');
  };

  const getDueDateColor = () => {
    if (isOverdue(task)) return 'text-red-600';
    if (isDueToday(task)) return 'text-amber-600';
    return 'text-gray-500';
  };

  const getBorderColor = () => {
    if (isOverdue(task)) return 'border-l-4 border-red-500';
    if (isDueToday(task)) return 'border-l-4 border-amber-400';
    return 'border-l-4 border-transparent';
  };

  const dueDateText = formatDueDate();
  const displayedTags = task.tags.slice(0, 3);
  const remainingTags = task.tags.length - 3;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow ${getBorderColor()}`}
      onClick={() => onEdit(task)}
    >
      {/* Top row: Priority badge + Due date */}
      <div className="flex items-center justify-between mb-2">
        <PriorityBadge priority={task.priority} />
        {dueDateText && (
          <span className={`text-xs font-medium ${getDueDateColor()}`}>
            {dueDateText}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm truncate mb-1">{task.title}</h3>

      {/* Quick Note */}
      {task.note && (
        <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">{task.note}</p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {displayedTags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
          {remainingTags > 0 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">
              +{remainingTags}
            </span>
          )}
        </div>
      )}

      {/* Move buttons row */}
      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-gray-100">
        {canMoveLeft && (
          <button
            onClick={handleMoveLeft}
            className="text-gray-400 hover:text-gray-700 p-1 transition-colors"
            aria-label="Move left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {canMoveRight && (
          <button
            onClick={handleMoveRight}
            className="text-gray-400 hover:text-gray-700 p-1 transition-colors"
            aria-label="Move right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
