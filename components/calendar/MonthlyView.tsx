'use client';

import { Task } from '@/lib/types';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format, parseISO } from 'date-fns';
import { isOverdue } from '@/lib/utils';

interface MonthlyViewProps {
  tasks: Task[];
  currentDate: Date;
  onTaskClick: (task: Task) => void;
}

export function MonthlyView({ tasks, currentDate, onTaskClick }: MonthlyViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(
      (task) => task.dueDate !== null && isSameDay(parseISO(task.dueDate), day)
    );
  };

  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-2">
        {weekdayLabels.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((day, idx) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={idx}
              className={`bg-white p-1 min-h-[100px] flex flex-col ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
              } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
            >
              {/* Day number */}
              <div className="text-xs font-medium mb-1">{format(day, 'd')}</div>

              {/* Tasks */}
              <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                {dayTasks.slice(0, 3).map((task) => {
                  const overdue = isOverdue(task);
                  const priorityColors = {
                    high: 'bg-red-100 text-red-700',
                    medium: 'bg-amber-100 text-amber-700',
                    low: 'bg-green-100 text-green-700',
                  };
                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                        priorityColors[task.priority]
                      } ${overdue ? 'ring-1 ring-red-300' : ''}`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500 px-1 py-0.5">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
