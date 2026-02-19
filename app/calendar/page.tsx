'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, UpdateTaskInput, CreateTaskInput } from '@/lib/types';
import { api } from '@/lib/api';
import { CalendarView } from '@/components/calendar/CalendarView';
import { MonthlyView } from '@/components/calendar/MonthlyView';
import { WeeklyView } from '@/components/calendar/WeeklyView';
import { DailyView } from '@/components/calendar/DailyView';
import { TaskModal } from '@/components/task/TaskModal';

export default function CalendarPage() {
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.calendar.get(view, currentDate.toISOString());
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to fetch calendar tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [view, currentDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CreateTaskInput | UpdateTaskInput) => {
    if (!selectedTask) return;
    try {
      await api.tasks.update(selectedTask.id, data);
      setIsModalOpen(false);
      setSelectedTask(null);
      await fetchTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.tasks.delete(id);
      setIsModalOpen(false);
      setSelectedTask(null);
      await fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h1>
      <CalendarView
        view={view}
        currentDate={currentDate}
        onViewChange={setView}
        onDateChange={setCurrentDate}
      >
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : view === 'monthly' ? (
          <MonthlyView tasks={tasks} currentDate={currentDate} onTaskClick={handleTaskClick} />
        ) : view === 'weekly' ? (
          <WeeklyView tasks={tasks} currentDate={currentDate} onTaskClick={handleTaskClick} />
        ) : (
          <DailyView tasks={tasks} currentDate={currentDate} onTaskClick={handleTaskClick} />
        )}
      </CalendarView>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
