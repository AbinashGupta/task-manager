import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { v4 } from 'uuid';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/lib/types';
import { IStorage } from './interface';
import { sanitizeCsvField } from '@/lib/utils';

export class CsvStorage implements IStorage {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private ensureFile(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      const header = 'id,title,description,note,status,priority,dueDate,createdAt,updatedAt,recurringFrequency,recurringEndDate,tags\n';
      fs.writeFileSync(this.filePath, header, 'utf-8');
    }
  }

  private async readAll(): Promise<Task[]> {
    this.ensureFile();
    const content = fs.readFileSync(this.filePath, 'utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    
    return records.map((record: any) => ({
      id: record.id,
      title: record.title,
      description: record.description || '',
      note: record.note || '',
      status: record.status as TaskStatus,
      priority: record.priority,
      dueDate: record.dueDate === '' ? null : record.dueDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      recurringFrequency: record.recurringFrequency,
      recurringEndDate: record.recurringEndDate === '' ? null : record.recurringEndDate,
      tags: record.tags === '' ? [] : record.tags.split('|').filter((t: string) => t.trim() !== ''),
    }));
  }

  private async writeAll(tasks: Task[]): Promise<void> {
    this.ensureFile();
    const rows = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      note: task.note,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || '',
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      recurringFrequency: task.recurringFrequency,
      recurringEndDate: task.recurringEndDate || '',
      tags: task.tags.join('|'),
    }));
    
    const csv = stringify(rows, { header: true });
    const tmpPath = this.filePath + '.tmp';
    fs.writeFileSync(tmpPath, csv, 'utf-8');
    fs.renameSync(tmpPath, this.filePath);
  }

  async getAllTasks(): Promise<Task[]> {
    return this.readAll();
  }

  async getTaskById(id: string): Promise<Task | null> {
    const tasks = await this.readAll();
    return tasks.find(t => t.id === id) || null;
  }

  async createTask(data: CreateTaskInput): Promise<Task> {
    const id = v4();
    const now = new Date().toISOString();
    
    const task: Task = {
      id,
      title: sanitizeCsvField(data.title),
      description: sanitizeCsvField(data.description || ''),
      note: sanitizeCsvField(data.note || ''),
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      dueDate: data.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
      recurringFrequency: data.recurringFrequency || 'none',
      recurringEndDate: data.recurringEndDate ?? null,
      tags: data.tags || [],
    };

    const tasks = await this.readAll();
    tasks.push(task);
    await this.writeAll(tasks);
    return task;
  }

  async updateTask(id: string, updates: UpdateTaskInput): Promise<Task> {
    const tasks = await this.readAll();
    const index = tasks.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Task not found');
    }

    const existing = tasks[index];
    const updated: Task = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Sanitize string fields that were updated
    if (updates.title !== undefined) updated.title = sanitizeCsvField(updated.title);
    if (updates.description !== undefined) updated.description = sanitizeCsvField(updated.description);
    if (updates.note !== undefined) updated.note = sanitizeCsvField(updated.note);

    tasks[index] = updated;
    await this.writeAll(tasks);
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = await this.readAll();
    const originalLength = tasks.length;
    const filtered = tasks.filter(t => t.id !== id);
    
    if (filtered.length === originalLength) {
      throw new Error('Task not found');
    }

    await this.writeAll(filtered);
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const tasks = await this.readAll();
    return tasks.filter(t => t.status === status);
  }

  async getTasksByDateRange(start: Date, end: Date): Promise<Task[]> {
    const tasks = await this.readAll();
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= start && dueDate <= end;
    });
  }
}

const csvPath = process.env.CSV_PATH || path.join(process.cwd(), 'data', 'tasks.csv');
export const storage = new CsvStorage(csvPath);
