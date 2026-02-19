import { NextRequest, NextResponse } from 'next/server';
import { parseISO, format, startOfWeek } from 'date-fns';
import { storage } from '@/lib/storage/csvStorage';
import { isOverdue } from '@/lib/utils';
import { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'summary';
    const tasks = await storage.getAllTasks();

    if (type === 'summary') {
      const byStatus: Record<string, number> = {
        todo: 0,
        'in-progress': 0,
        blocked: 0,
        done: 0,
      };
      const byPriority: Record<string, number> = {
        high: 0,
        medium: 0,
        low: 0,
      };

      tasks.forEach(task => {
        byStatus[task.status] = (byStatus[task.status] || 0) + 1;
        byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
      });

      const overdueCount = tasks.filter(isOverdue).length;
      const doneCount = byStatus.done || 0;
      const total = tasks.length;
      const completionRate = total > 0 ? doneCount / total : 0;

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const completedThisWeek = tasks.filter(
        t => t.status === 'done' && new Date(t.updatedAt) >= weekStart
      ).length;

      const response: ApiResponse<{
        total: number;
        byStatus: Record<string, number>;
        byPriority: Record<string, number>;
        overdue: number;
        completionRate: number;
        completedThisWeek: number;
      }> = {
        success: true,
        data: {
          total,
          byStatus,
          byPriority,
          overdue: overdueCount,
          completionRate,
          completedThisWeek,
        },
        error: null,
      };
      return NextResponse.json(response, { status: 200 });
    }

    if (type === 'productivity') {
      const doneTasks = tasks.filter(t => t.status === 'done');
      
      // Get last 7 days
      const today = new Date();
      const last7Days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(format(date, 'yyyy-MM-dd'));
      }

      const completedPerDay = last7Days.map(date => {
        const count = doneTasks.filter(t => {
          const updatedDate = format(parseISO(t.updatedAt), 'yyyy-MM-dd');
          return updatedDate === date;
        }).length;
        return { date, count };
      });

      let avgCompletionTimeHours = 0;
      if (doneTasks.length > 0) {
        const completionTimes = doneTasks.map(t => {
          const created = new Date(t.createdAt).getTime();
          const updated = new Date(t.updatedAt).getTime();
          return (updated - created) / (1000 * 60 * 60); // Convert to hours
        });
        const sum = completionTimes.reduce((a, b) => a + b, 0);
        avgCompletionTimeHours = sum / completionTimes.length;
      }

      const response: ApiResponse<{
        completedPerDay: Array<{ date: string; count: number }>;
        avgCompletionTimeHours: number;
      }> = {
        success: true,
        data: {
          completedPerDay,
          avgCompletionTimeHours,
        },
        error: null,
      };
      return NextResponse.json(response, { status: 200 });
    }

    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: 'Invalid type parameter. Must be summary or productivity',
    };
    return NextResponse.json(response, { status: 400 });
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
