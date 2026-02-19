export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export type RecurringFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Task {
  id: string;                          // UUID v4
  title: string;                       // required, max 200 chars
  description: string;                 // optional, can be empty string
  note: string;                        // short quick-note visible on kanban tile, max 100 chars
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;              // ISO 8601 e.g. "2026-02-20T00:00:00.000Z", or null
  createdAt: string;                   // ISO 8601, set on creation, never changes
  updatedAt: string;                   // ISO 8601, updated on every edit
  recurringFrequency: RecurringFrequency;
  recurringEndDate: string | null;     // ISO 8601 or null
  tags: string[];                      // array of strings, stored pipe-delimited in CSV
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  note?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string | null;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  note?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string | null;
  tags?: string[];
}

export interface KanbanColumns {
  todo: Task[];
  'in-progress': Task[];
  blocked: Task[];
  done: Task[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'blocked', 'done'];

// Statuses that can be navigated using caret buttons (skipping blocked)
export const CARET_NAVIGABLE_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];

export const COLUMN_LABELS: Record<TaskStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'blocked': 'Blocked',
  'done': 'Done',
};

/**
 * Get the next status for caret navigation (skips blocked)
 * Progression: todo → in-progress → done
 */
export function getNextCaretStatus(currentStatus: TaskStatus): TaskStatus | null {
  const index = CARET_NAVIGABLE_STATUSES.indexOf(currentStatus);
  if (index === -1 || index === CARET_NAVIGABLE_STATUSES.length - 1) {
    return null; // Already at last status or not in navigable list
  }
  return CARET_NAVIGABLE_STATUSES[index + 1];
}

/**
 * Get the previous status for caret navigation (skips blocked)
 * Progression: done → in-progress → todo
 */
export function getPreviousCaretStatus(currentStatus: TaskStatus): TaskStatus | null {
  const index = CARET_NAVIGABLE_STATUSES.indexOf(currentStatus);
  if (index <= 0) {
    return null; // Already at first status or not in navigable list
  }
  return CARET_NAVIGABLE_STATUSES[index - 1];
}
