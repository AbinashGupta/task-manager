import { NextResponse } from 'next/server';
import { getKanbanColumns } from '@/lib/services/taskService';
import { ApiResponse, KanbanColumns } from '@/lib/types';
import { storage } from '@/lib/storage/csvStorage';

// Prevent static prerender at build time (e.g. in Docker the CSV may be empty then).
// Without this, GET with no request usage can be cached with empty columns.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[COLUMNS-API] GET /api/kanban/columns — flow start', { csvPath: storage.getFilePath() });

    const columns = await getKanbanColumns();
    const totalInColumns =
      columns.todo.length + columns['in-progress'].length + columns.blocked.length + columns.done.length;
    console.log('[COLUMNS-API] GET /api/kanban/columns — getKanbanColumns returned', {
      todo: columns.todo.length,
      'in-progress': columns['in-progress'].length,
      blocked: columns.blocked.length,
      done: columns.done.length,
      totalInColumns,
      taskIds: [
        ...columns.todo.map((t) => t.id),
        ...columns['in-progress'].map((t) => t.id),
        ...columns.blocked.map((t) => t.id),
        ...columns.done.map((t) => t.id),
      ],
    });

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
