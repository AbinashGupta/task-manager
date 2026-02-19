import { Task } from '@/lib/types';
import { isBefore, isToday, parseISO, addDays, addWeeks, addMonths, addYears, endOfDay, endOfWeek, endOfMonth, endOfYear, isAfter } from 'date-fns';

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') return false;
  return isBefore(parseISO(task.dueDate), new Date());
}

export function isDueToday(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') return false;
  return isToday(parseISO(task.dueDate));
}

export function isDueSoon(task: Task, hoursAhead: number = 24): boolean {
  if (!task.dueDate || task.status === 'done') return false;
  const due = parseISO(task.dueDate);
  const now = new Date();
  const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  return due > now && due <= cutoff;
}

export function getNextRecurringDate(currentDueDate: string, frequency: string): string | null {
  const date = parseISO(currentDueDate);
  switch (frequency) {
    case 'daily': return addDays(date, 1).toISOString();
    case 'weekly': return addWeeks(date, 1).toISOString();
    case 'monthly': return addMonths(date, 1).toISOString();
    case 'yearly': return addYears(date, 1).toISOString();
    default: return null;
  }
}

/**
 * Get the next recurring date from a completed task's due date
 * This calculates the next occurrence based on the completed task's due date,
 * ensuring proper sequence continuation
 * - Daily: next day at end of day (from completed task's due date + 1 day)
 * - Weekly: end of next week (from completed task's due date + 1 week)
 * - Monthly: end of next month (from completed task's due date + 1 month)
 * - Yearly: end of next year (from completed task's due date + 1 year)
 */
export function getNextRecurringDateFromDueDate(dueDate: string, frequency: string): string | null {
  if (!dueDate) return null;
  
  const completedTaskDate = parseISO(dueDate);
  let nextDate: Date;
  
  switch (frequency) {
    case 'daily':
      // Next occurrence is the day after the completed task's due date, at end of day
      nextDate = endOfDay(addDays(completedTaskDate, 1));
      break;
    case 'weekly':
      // Next occurrence is end of the week after the completed task's due date
      const nextWeek = addWeeks(completedTaskDate, 1);
      nextDate = endOfWeek(nextWeek, { weekStartsOn: 1 });
      break;
    case 'monthly':
      // Next occurrence is end of the month after the completed task's due date
      const nextMonth = addMonths(completedTaskDate, 1);
      nextDate = endOfMonth(nextMonth);
      break;
    case 'yearly':
      // Next occurrence is end of the year after the completed task's due date
      const nextYear = addYears(completedTaskDate, 1);
      nextDate = endOfYear(nextYear);
      break;
    default:
      return null;
  }
  
  return nextDate.toISOString();
}

export function sanitizeCsvField(value: string): string {
  if (typeof value !== 'string') return value;
  return value.replace(/^[=+\-@\t\r]+/, '');
}

/**
 * Get the end of period date based on recurring frequency
 * - daily: end of the given day
 * - weekly: end of the week containing the given date (Monday = first day, Sunday = last day)
 * - monthly: end of the month containing the given date
 * - yearly: end of the year containing the given date
 */
export function getEndOfPeriodDate(date: Date, frequency: string): Date {
  switch (frequency) {
    case 'daily':
      return endOfDay(date);
    case 'weekly':
      // Week starts on Monday (1), ends on Sunday
      return endOfWeek(date, { weekStartsOn: 1 });
    case 'monthly':
      return endOfMonth(date);
    case 'yearly':
      return endOfYear(date);
    default:
      return date;
  }
}

/**
 * Get the initial due date for a new recurring task
 * Sets due date to end of current period (today for daily, end of current week for weekly, etc.)
 */
export function getInitialRecurringDueDate(frequency: string): string {
  const now = new Date();
  return getEndOfPeriodDate(now, frequency).toISOString();
}

/**
 * Expand recurring tasks to show all instances within a date range
 * For each recurring task, generates virtual task instances for each occurrence
 * that falls within the start and end date range.
 */
export function expandRecurringTasks(tasks: Task[], start: Date, end: Date): Task[] {
  const expanded: Task[] = [];
  
  for (const task of tasks) {
    // Add the original task if it's in range
    if (task.dueDate) {
      const dueDate = parseISO(task.dueDate);
      if (dueDate >= start && dueDate <= end) {
        expanded.push(task);
      }
    }
    
    // Expand recurring tasks
    if (task.recurringFrequency !== 'none' && task.dueDate) {
      let currentDate = parseISO(task.dueDate);
      const endDate = task.recurringEndDate ? parseISO(task.recurringEndDate) : null;
      
      // Generate instances forward until we exceed the end date
      while (currentDate <= end) {
        // Skip if before start date
        if (currentDate >= start) {
          // Check if we've exceeded the recurring end date
          if (endDate && currentDate > endDate) {
            break;
          }
          
          // Create a virtual instance (only if not already added as original task)
          if (!task.dueDate || parseISO(task.dueDate).getTime() !== currentDate.getTime()) {
            expanded.push({
              ...task,
              id: `${task.id}-${currentDate.toISOString()}`, // Unique ID for virtual instance
              dueDate: currentDate.toISOString(),
            });
          }
        }
        
        // Move to next occurrence
        const nextDateStr = getNextRecurringDate(currentDate.toISOString(), task.recurringFrequency);
        if (!nextDateStr) break;
        currentDate = parseISO(nextDateStr);
        
        // Safety check to prevent infinite loops
        if (isAfter(currentDate, end) && currentDate.getTime() > end.getTime() + 365 * 24 * 60 * 60 * 1000) {
          break;
        }
      }
    }
  }
  
  return expanded;
}
