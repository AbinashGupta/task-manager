import { NextResponse } from 'next/server';
import { getKanbanColumns } from '@/lib/services/taskService';
import { ApiResponse, KanbanColumns } from '@/lib/types';

export async function GET() {
  try {
    const columns = await getKanbanColumns();
    const response: ApiResponse<KanbanColumns> = {
      success: true,
      data: columns,
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
