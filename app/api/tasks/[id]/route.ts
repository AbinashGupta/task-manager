import { NextRequest, NextResponse } from 'next/server';
import { getTask, updateTask, deleteTask } from '@/lib/services/taskService';
import { updateTaskSchema } from '@/lib/validations';
import { ApiResponse, Task } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await getTask(id);

    if (!task) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Task not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Task> = {
      success: true,
      data: task,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateTaskSchema.safeParse(body);

    if (!result.success) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: result.error.issues[0]?.message || 'Validation failed',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const task = await updateTask(id, result.data);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateTaskSchema.safeParse(body);

    if (!result.success) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: result.error.issues[0]?.message || 'Validation failed',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const task = await updateTask(id, result.data);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteTask(id);
    const response: ApiResponse<{ deleted: string }> = {
      success: true,
      data: { deleted: id },
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
