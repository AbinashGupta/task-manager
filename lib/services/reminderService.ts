import { storage } from '@/lib/storage/csvStorage';
import { Task } from '@/lib/types';
import { isOverdue, isDueToday, isDueSoon } from '@/lib/utils';

export async function getOverdueTasks(): Promise<Task[]> {
  const tasks = await storage.getAllTasks();
  return tasks.filter(isOverdue);
}

export async function getDueTodayTasks(): Promise<Task[]> {
  const tasks = await storage.getAllTasks();
  return tasks.filter(isDueToday);
}

export async function getReminderCounts(): Promise<{
  overdue: number;
  dueToday: number;
  dueSoon: number;
}> {
  const tasks = await storage.getAllTasks();
  return {
    overdue: tasks.filter(isOverdue).length,
    dueToday: tasks.filter(isDueToday).length,
    dueSoon: tasks.filter(t => isDueSoon(t, 24)).length,
  };
}
