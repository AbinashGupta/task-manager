import { NextRequest, NextResponse } from 'next/server';
import { listTasks, createTask } from '@/lib/services/taskService';
import { createTaskSchema } from '@/lib/validations';
import { ApiResponse, Task } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters: {
      status?: any;
      priority?: string;
      dueBefore?: string;
      dueAfter?: string;
      tags?: string;
    } = {};

    if (searchParams.has('status')) filters.status = searchParams.get('status') || undefined;
    if (searchParams.has('priority')) filters.priority = searchParams.get('priority') || undefined;
    if (searchParams.has('dueBefore')) filters.dueBefore = searchParams.get('dueBefore') || undefined;
    if (searchParams.has('dueAfter')) filters.dueAfter = searchParams.get('dueAfter') || undefined;
    if (searchParams.has('tags')) filters.tags = searchParams.get('tags') || undefined;

    const tasks = await listTasks(filters);
    const response: ApiResponse<Task[]> = {
      success: true,
      data: tasks,
      error: null,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createTaskSchema.safeParse(body);

    if (!result.success) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: result.error.issues[0]?.message || 'Validation failed',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const task = await createTask(result.data);
    const response: ApiResponse<Task> = {
      success: true,
      data: task,
      error: null,
    };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
