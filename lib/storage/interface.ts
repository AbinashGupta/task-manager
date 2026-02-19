import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/lib/types';

export interface IStorage {
  getAllTasks(): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | null>;
  createTask(data: CreateTaskInput): Promise<Task>;
  updateTask(id: string, updates: UpdateTaskInput): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  getTasksByStatus(status: TaskStatus): Promise<Task[]>;
  getTasksByDateRange(start: Date, end: Date): Promise<Task[]>;
}
