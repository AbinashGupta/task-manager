'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';

interface ReportsDashboardProps {
  summary: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    completionRate: number;
    completedThisWeek: number;
  } | null;
  productivity: {
    completedPerDay: { date: string; count: number }[];
    avgCompletionTimeHours: number;
  } | null;
}

export function ReportsDashboard({ summary, productivity }: ReportsDashboardProps) {
  if (!summary || !productivity) {
    return (
      <div className="text-center py-12 text-gray-500">Loading reports...</div>
    );
  }

  const statusData = [
    { name: 'To Do', value: summary.byStatus['todo'] || 0, color: '#3b82f6' },
    { name: 'In Progress', value: summary.byStatus['in-progress'] || 0, color: '#f59e0b' },
    { name: 'Blocked', value: summary.byStatus['blocked'] || 0, color: '#ef4444' },
    { name: 'Done', value: summary.byStatus['done'] || 0, color: '#22c55e' },
  ];

  const priorityData = [
    { name: 'High', value: summary.byPriority['high'] || 0, color: '#ef4444' },
    { name: 'Medium', value: summary.byPriority['medium'] || 0, color: '#f59e0b' },
    { name: 'Low', value: summary.byPriority['low'] || 0, color: '#22c55e' },
  ];

  const barData = productivity.completedPerDay.map((d) => ({
    date: format(parseISO(d.date), 'EEE'),
    count: d.count,
  }));

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold">{summary.total}</div>
          <div className="text-sm text-gray-500 mt-1">Total Tasks</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold">{Math.round(summary.completionRate * 100)}%</div>
          <div className="text-sm text-gray-500 mt-1">Completion Rate</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className={`text-3xl font-bold ${summary.overdue > 0 ? 'text-red-600' : ''}`}>
            {summary.overdue}
          </div>
          <div className="text-sm text-gray-500 mt-1">Overdue</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold">{summary.completedThisWeek}</div>
          <div className="text-sm text-gray-500 mt-1">Completed This Week</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Tasks by Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {statusData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by Priority */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={priorityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {priorityData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Tasks Completed (Last 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Average Completion Time */}
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <div className="text-3xl font-bold">
          {productivity.avgCompletionTimeHours.toFixed(1)}h
        </div>
        <div className="text-sm text-gray-500 mt-1">Avg. Completion Time</div>
      </div>
    </div>
  );
}

export default ReportsDashboard;
