'use client';

import { Task } from '@/lib/types';
import { startOfWeek, eachDayOfInterval, addDays, isSameDay, format, parseISO } from 'date-fns';
import { PriorityBadge } from '@/components/task/PriorityBadge';
import { isOverdue } from '@/lib/utils';

interface WeeklyViewProps {
  tasks: Task[];
  currentDate: Date;
  onTaskClick: (task: Task) => void;
}

export function WeeklyView({ tasks, currentDate, onTaskClick }: WeeklyViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(
      (task) => task.dueDate !== null && isSameDay(parseISO(task.dueDate), day)
    );
  };

  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="grid grid-cols-7 gap-4">
      {days.map((day, idx) => {
        const dayTasks = getTasksForDay(day);
        const isToday = isSameDay(day, new Date());

        return (
          <div key={idx} className="bg-gray-50 rounded-xl p-2 min-h-[300px] flex flex-col gap-2">
            {/* Day header */}
            <div className={`text-center text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
              <div>{weekdayLabels[idx]}</div>
              <div>{format(day, 'MMM d')}</div>
            </div>

            {/* Tasks */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
              {dayTasks.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={`bg-white rounded-lg p-2 shadow-sm border cursor-pointer hover:shadow-md text-sm ${
                      overdue ? 'ring-1 ring-red-300' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <div className="font-medium truncate">{task.title}</div>
                    {task.note && (
                      <div className="text-xs text-gray-500 italic mt-1 truncate">{task.note}</div>
                    )}
                  </div>
                );
              })}
              {dayTasks.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-4">No tasks</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
