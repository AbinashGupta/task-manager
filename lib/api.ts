import { Task, KanbanColumns, ApiResponse, CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/lib/types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error || 'Unknown error');
  return json.data as T;
}

export const api = {
  tasks: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<Task[]>(`/tasks${query}`);
    },
    get: (id: string) => request<Task>(`/tasks/${id}`),
    create: (data: CreateTaskInput) =>
      request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateTaskInput) =>
      request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    patch: (id: string, data: UpdateTaskInput) =>
      request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ deleted: string }>(`/tasks/${id}`, { method: 'DELETE' }),
  },
  kanban: {
    columns: () => request<KanbanColumns>('/kanban/columns'),
    move: (taskId: string, newStatus: TaskStatus) =>
      request<Task>('/kanban/move', {
        method: 'PATCH',
        body: JSON.stringify({ taskId, newStatus }),
      }),
  },
  calendar: {
    get: (view: string, date: string) =>
      request<{ view: string; startDate: string; endDate: string; tasks: Task[] }>(
        `/calendar?view=${view}&date=${date}`
      ),
  },
  reports: {
    summary: () => request<any>('/reports?type=summary'),
    productivity: () => request<any>('/reports?type=productivity'),
  },
};
