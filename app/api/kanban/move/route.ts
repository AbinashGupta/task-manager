import { NextRequest, NextResponse } from 'next/server';
import { moveTask } from '@/lib/services/taskService';
import { moveTaskSchema } from '@/lib/validations';
import { ApiResponse, Task } from '@/lib/types';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = moveTaskSchema.safeParse(body);

    if (!result.success) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: result.error.issues[0]?.message || 'Validation failed',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const task = await moveTask(result.data.taskId, result.data.newStatus);
    const response: ApiResponse<Task> = {
      success: true,
      data: task,
      error: null,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Task not found',
      };
      return NextResponse.json(response, { status: 404 });
    }
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
