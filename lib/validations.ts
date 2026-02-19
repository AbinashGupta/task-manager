import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  note: z.string().max(100).optional().default(''),
  status: z.enum(['todo', 'in-progress', 'blocked', 'done']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  dueDate: z.string().nullable().optional().default(null),
  recurringFrequency: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).optional().default('none'),
  recurringEndDate: z.string().nullable().optional().default(null),
  tags: z.array(z.string()).optional().default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  note: z.string().max(100).optional(),
  status: z.enum(['todo', 'in-progress', 'blocked', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().nullable().optional(),
  recurringFrequency: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurringEndDate: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const moveTaskSchema = z.object({
  taskId: z.string().uuid(),
  newStatus: z.enum(['todo', 'in-progress', 'blocked', 'done']),
});
