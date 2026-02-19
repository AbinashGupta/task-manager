import { TaskPriority } from '@/lib/types';

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
  };

  const labels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
}
