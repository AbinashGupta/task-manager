import { NextRequest, NextResponse } from 'next/server';
import { parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { storage } from '@/lib/storage/csvStorage';
import { ApiResponse } from '@/lib/types';
import { expandRecurringTasks } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get('view');
    const dateStr = searchParams.get('date');

    if (!view || !dateStr) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Missing view or date parameter',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!['daily', 'weekly', 'monthly'].includes(view)) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Invalid view parameter. Must be daily, weekly, or monthly',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const date = parseISO(dateStr);
    let start: Date;
    let end: Date;

    switch (view) {
      case 'daily':
        start = startOfDay(date);
        end = endOfDay(date);
        break;
      case 'weekly':
        start = startOfWeek(date, { weekStartsOn: 1 });
        end = endOfWeek(date, { weekStartsOn: 1 });
        break;
      case 'monthly':
        start = startOfMonth(date);
        end = endOfMonth(date);
        break;
      default:
        start = startOfDay(date);
        end = endOfDay(date);
    }

    // Get all tasks first (we need recurring tasks even if their dueDate is outside range)
    const allTasks = await storage.getAllTasks();
    
    // Expand recurring tasks to show all instances within the date range
    const tasks = expandRecurringTasks(allTasks, start, end);
    
    const response: ApiResponse<{
      view: string;
      startDate: string;
      endDate: string;
      tasks: any[];
    }> = {
      success: true,
      data: {
        view,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        tasks,
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
