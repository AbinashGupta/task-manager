'use client';

import { useState, useEffect } from 'react';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority, RecurringFrequency } from '@/lib/types';
import { getEndOfPeriodDate, getInitialRecurringDueDate } from '@/lib/utils';

interface TaskModalProps {
  task: Task | null; // null = create mode, Task object = edit mode
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTaskInput | UpdateTaskInput) => void | Promise<void>;
  onDelete?: (id: string) => void;
}

export function TaskModal({ task, isOpen, onClose, onSave, onDelete }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('none');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [tags, setTags] = useState('');

  // Helper to format date for datetime-local input (handles timezone correctly)
  const formatDateForInput = (isoString: string): string => {
    const date = new Date(isoString);
    // Get local date/time components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (task) {
      // Edit mode: initialize from task
      setTitle(task.title);
      setNote(task.note);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? formatDateForInput(task.dueDate) : '');
      setRecurringFrequency(task.recurringFrequency);
      setRecurringEndDate(
        task.recurringEndDate ? formatDateForInput(task.recurringEndDate) : ''
      );
      setTags(task.tags.join(', '));
    } else {
      // Create mode: reset to defaults
      setTitle('');
      setNote('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setDueDate('');
      setRecurringFrequency('none');
      setRecurringEndDate('');
      setTags('');
    }
  }, [task, isOpen]);

  // Auto-set or adjust due date when recurring frequency changes
  useEffect(() => {
    if (recurringFrequency !== 'none') {
      if (!dueDate) {
        // No dueDate set: set to end of current period
        const initialDueDate = getInitialRecurringDueDate(recurringFrequency);
        setDueDate(formatDateForInput(initialDueDate));
      } else {
        // DueDate exists: adjust to end of period containing that date
        const currentDate = new Date(dueDate);
        const endOfPeriod = getEndOfPeriodDate(currentDate, recurringFrequency);
        // Only update if the date would change significantly (more than 1 hour difference)
        const timeDiff = Math.abs(endOfPeriod.getTime() - currentDate.getTime());
        if (timeDiff > 60 * 60 * 1000) { // More than 1 hour difference
          const newDueDate = formatDateForInput(endOfPeriod.toISOString());
          // Only update if different to avoid unnecessary re-renders
          if (newDueDate !== dueDate) {
            setDueDate(newDueDate);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurringFrequency]); // Only run when frequency changes, not when dueDate changes

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // For recurring tasks, set due date appropriately:
    // - If no dueDate provided: set to end of current period (today for daily, end of week for weekly, etc.)
    // - If dueDate provided: set to end of period containing that date
    let finalDueDate: string | null = null;
    if (recurringFrequency !== 'none') {
      if (dueDate) {
        // User provided a date, set to end of period containing that date
        const date = new Date(dueDate);
        const endOfPeriod = getEndOfPeriodDate(date, recurringFrequency);
        finalDueDate = endOfPeriod.toISOString();
      } else {
        // No dueDate provided, set to end of current period
        finalDueDate = getInitialRecurringDueDate(recurringFrequency);
      }
    } else {
      // Non-recurring task: use provided dueDate as-is
      if (dueDate) {
        finalDueDate = new Date(dueDate).toISOString();
      }
    }

    const data: CreateTaskInput = {
      title: title.trim(),
      note: note.trim() || undefined,
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: finalDueDate,
      recurringFrequency,
      recurringEndDate: recurringFrequency !== 'none' && recurringEndDate
        ? new Date(recurringEndDate).toISOString()
        : null,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
    };

    onSave(data);
  };

  const handleDelete = () => {
    if (!task || !onDelete) return;
    if (window.confirm('Delete this task?')) {
      onDelete(task.id);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 z-50 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">
          {task ? 'Edit Task' : 'Create Task'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Quick Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quick Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={100}
              placeholder="Short note visible on card..."
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Recurring Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recurring
            </label>
            <select
              value={recurringFrequency}
              onChange={(e) => setRecurringFrequency(e.target.value as RecurringFrequency)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Recurring End Date */}
          {recurringFrequency !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recurring Until
              </label>
              <input
                type="datetime-local"
                value={recurringEndDate}
                onChange={(e) => setRecurringEndDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            {task && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors mr-auto"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
