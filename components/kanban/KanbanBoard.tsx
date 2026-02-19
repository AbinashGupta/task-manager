'use client';

import { KanbanColumns, TaskStatus, Task } from '@/lib/types';
import { TASK_STATUSES, COLUMN_LABELS } from '@/lib/types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  columns: KanbanColumns;
  onMoveTask: (id: string, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

export function KanbanBoard({ columns, onMoveTask, onEditTask }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {TASK_STATUSES.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          label={COLUMN_LABELS[status]}
          tasks={columns[status]}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
        />
      ))}
    </div>
  );
}
