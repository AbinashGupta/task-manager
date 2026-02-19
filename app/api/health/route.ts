import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage/csvStorage';
import { ApiResponse } from '@/lib/types';

export async function GET() {
  try {
    const tasks = await storage.getAllTasks();
    const response: ApiResponse<{ status: string; taskCount: number; timestamp: string }> = {
      success: true,
      data: {
        status: 'ok',
        taskCount: tasks.length,
        timestamp: new Date().toISOString(),
      },
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
