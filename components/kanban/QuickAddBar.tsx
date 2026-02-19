'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface QuickAddBarProps {
  onTaskCreated: () => void;
}

export function QuickAddBar({ onTaskCreated }: QuickAddBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmedValue = inputValue.trim();
      if (!trimmedValue) return;

      setIsLoading(true);
      try {
        await api.tasks.create({ title: trimmedValue });
        setInputValue('');
        onTaskCreated();
      } catch (error) {
        console.error('Failed to create task:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyPress={handleKeyPress}
      placeholder="Quick add a task... (press Enter)"
      disabled={isLoading}
      className={`border border-gray-300 rounded-lg p-3 w-full text-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    />
  );
}
