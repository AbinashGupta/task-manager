'use client';

import { TaskStatus, Task } from '@/lib/types';
import { TaskCard } from '@/components/task/TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onMoveTask: (id: string, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

export function KanbanColumn({
  status,
  label,
  tasks,
  onMoveTask,
  onEditTask,
}: KanbanColumnProps) {
  const getBorderColor = () => {
    switch (status) {
      case 'todo':
        return 'border-t-4 border-blue-500';
      case 'in-progress':
        return 'border-t-4 border-amber-500';
      case 'blocked':
        return 'border-t-4 border-red-500';
      case 'done':
        return 'border-t-4 border-green-500';
      default:
        return 'border-t-4 border-gray-300';
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'todo':
        return 'bg-blue-50';
      case 'in-progress':
        return 'bg-amber-50';
      case 'blocked':
        return 'bg-red-50';
      case 'done':
        return 'bg-green-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className={`bg-gray-100 rounded-xl p-3 min-h-[400px] flex flex-col ${getBgColor()}`}>
      <div className={`mb-3 pb-2 ${getBorderColor()}`}>
        <h3 className="font-semibold text-sm text-gray-700">
          {label}
          <span className="text-gray-400 text-sm ml-2">({tasks.length})</span>
        </h3>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No tasks</p>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onMove={onMoveTask}
              onEdit={onEditTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
