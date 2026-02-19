'use client';

import { format, startOfWeek, endOfWeek, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';

interface CalendarViewProps {
  view: 'daily' | 'weekly' | 'monthly';
  currentDate: Date;
  onViewChange: (view: 'daily' | 'weekly' | 'monthly') => void;
  onDateChange: (date: Date) => void;
  children: React.ReactNode;
}

export function CalendarView({ view, currentDate, onViewChange, onDateChange, children }: CalendarViewProps) {
  const getDateLabel = () => {
    if (view === 'daily') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (view === 'weekly') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  const handlePrev = () => {
    let newDate: Date;
    if (view === 'daily') {
      newDate = subDays(currentDate, 1);
    } else if (view === 'weekly') {
      newDate = subWeeks(currentDate, 1);
    } else {
      newDate = subMonths(currentDate, 1);
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    let newDate: Date;
    if (view === 'daily') {
      newDate = addDays(currentDate, 1);
    } else if (view === 'weekly') {
      newDate = addWeeks(currentDate, 1);
    } else {
      newDate = addMonths(currentDate, 1);
    }
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        {/* View Switcher */}
        <div className="flex rounded-lg overflow-hidden border">
          <button
            onClick={() => onViewChange('daily')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => onViewChange('weekly')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
              view === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => onViewChange('monthly')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
              view === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Date Label */}
        <div className="text-lg font-semibold text-gray-900">
          {getDateLabel()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
          >
            &lt; Prev
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Next &gt;
          </button>
        </div>
      </div>

      {/* Content area */}
      {children}
    </div>
  );
}
