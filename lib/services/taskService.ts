import { storage } from '@/lib/storage/csvStorage';
import { CreateTaskInput, UpdateTaskInput, Task, TaskStatus } from '@/lib/types';
import { getNextRecurringDateFromDueDate } from '@/lib/utils';

export async function listTasks(filters?: {
  status?: TaskStatus;
  priority?: string;
  dueBefore?: string;
  dueAfter?: string;
  tags?: string;
}): Promise<Task[]> {
  let tasks = await storage.getAllTasks();
  if (filters?.status) tasks = tasks.filter(t => t.status === filters.status);
  if (filters?.priority) tasks = tasks.filter(t => t.priority === filters.priority);
  if (filters?.dueBefore) tasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) <= new Date(filters.dueBefore!));
  if (filters?.dueAfter) tasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) >= new Date(filters.dueAfter!));
  if (filters?.tags) {
    const filterTags = filters.tags.split(',').map(s => s.trim().toLowerCase());
    tasks = tasks.filter(t => t.tags.some(tag => filterTags.includes(tag.toLowerCase())));
  }
  return tasks;
}

export async function getTask(id: string): Promise<Task | null> {
  return storage.getTaskById(id);
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  return storage.createTask(data);
}

export async function updateTask(id: string, updates: UpdateTaskInput): Promise<Task> {
  const existing = await storage.getTaskById(id);
  if (!existing) throw new Error('Task not found');

  const updated = await storage.updateTask(id, updates);

  // Auto-create next recurring task when marking done
  if (updates.status === 'done' && existing.status !== 'done'
      && existing.recurringFrequency !== 'none' && existing.dueDate) {
    // Calculate next occurrence from the completed task's due date
    // This ensures proper sequence: if task was due Feb 19, next is Feb 20
    const nextDue = getNextRecurringDateFromDueDate(existing.dueDate, existing.recurringFrequency);
    if (nextDue) {
      const shouldCreate = !existing.recurringEndDate
        || new Date(nextDue) <= new Date(existing.recurringEndDate);
      if (shouldCreate) {
        await storage.createTask({
          title: existing.title,
          description: existing.description,
          note: existing.note,
          status: 'todo',
          priority: existing.priority,
          dueDate: nextDue,
          recurringFrequency: existing.recurringFrequency,
          recurringEndDate: existing.recurringEndDate,
          tags: existing.tags,
        });
      }
    }
  }

  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  return storage.deleteTask(id);
}

export async function getKanbanColumns() {
  const tasks = await storage.getAllTasks();
  return {
    'todo': tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    'blocked': tasks.filter(t => t.status === 'blocked'),
    'done': tasks.filter(t => t.status === 'done'),
  };
}

export async function moveTask(taskId: string, newStatus: TaskStatus): Promise<Task> {
  return updateTask(taskId, { status: newStatus });
}
