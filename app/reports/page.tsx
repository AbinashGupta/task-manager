'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

// Dynamically import ReportsDashboard to avoid SSR issues with Recharts
const ReportsDashboard = dynamic(
  () => import('@/components/reports/ReportsDashboard'),
  { ssr: false }
);

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [productivity, setProductivity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.reports.summary(),
      api.reports.productivity(),
    ])
      .then(([s, p]) => {
        setSummary(s);
        setProductivity(p);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch reports:', error);
        setIsLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <ReportsDashboard summary={summary} productivity={productivity} />
      )}
    </div>
  );
}
