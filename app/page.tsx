'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { KanbanColumns, Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/lib/types';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { QuickAddBar } from '@/components/kanban/QuickAddBar';
import { FilterBar } from '@/components/kanban/FilterBar';
import { TaskModal } from '@/components/task/TaskModal';

export default function Home() {
  const [columns, setColumns] = useState<KanbanColumns>({
    todo: [],
    'in-progress': [],
    blocked: [],
    done: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterTag, setFilterTag] = useState('');

  const refreshColumns = async () => {
    try {
      const data = await api.kanban.columns();
      setColumns(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch columns:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshColumns();
  }, []);

  const getFilteredColumns = (): KanbanColumns => {
    const filtered: KanbanColumns = {
      todo: [],
      'in-progress': [],
      blocked: [],
      done: [],
    };

    Object.keys(columns).forEach((status) => {
      const tasks = columns[status as keyof KanbanColumns];
      filtered[status as keyof KanbanColumns] = tasks.filter((task) => {
        // Priority filter
        if (filterPriority !== 'all' && task.priority !== filterPriority) {
          return false;
        }
        // Tag filter
        if (filterTag && filterTag.trim() !== '') {
          const tagMatch = task.tags.some((tag) =>
            tag.toLowerCase().includes(filterTag.toLowerCase())
          );
          if (!tagMatch) return false;
        }
        return true;
      });
    });

    return filtered;
  };

  const handleMove = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.kanban.move(taskId, newStatus);
      await refreshColumns();
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setIsCreateMode(false);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedTask(null);
    setIsCreateMode(true);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CreateTaskInput | UpdateTaskInput) => {
    try {
      if (selectedTask) {
        // Edit mode
        await api.tasks.update(selectedTask.id, data);
      } else {
        // Create mode - ensure title is present
        if ('title' in data && data.title) {
          await api.tasks.create(data as CreateTaskInput);
        } else {
          throw new Error('Title is required for new tasks');
        }
      }
      setIsModalOpen(false);
      setSelectedTask(null);
      await refreshColumns();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.tasks.delete(id);
      setIsModalOpen(false);
      setSelectedTask(null);
      await refreshColumns();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleFilterChange = (filters: { priority: string; tag: string }) => {
    setFilterPriority(filters.priority);
    setFilterTag(filters.tag);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
        <button
          onClick={handleCreateClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Task
        </button>
      </div>

      <QuickAddBar onTaskCreated={refreshColumns} />

      <FilterBar onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <KanbanBoard
          columns={getFilteredColumns()}
          onMoveTask={handleMove}
          onEditTask={handleEditClick}
        />
      )}

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleSave}
        onDelete={selectedTask ? handleDelete : undefined}
      />
    </div>
  );
}
