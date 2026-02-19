'use client';

import { useState, useEffect } from 'react';

interface FilterBarProps {
  onFilterChange: (filters: { priority: string; tag: string }) => void;
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [priority, setPriority] = useState('all');
  const [tag, setTag] = useState('');

  useEffect(() => {
    onFilterChange({ priority, tag });
  }, [priority, tag, onFilterChange]);

  const handleClear = () => {
    setPriority('all');
    setTag('');
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTag(e.target.value);
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onFilterChange({ priority, tag });
    }
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      >
        <option value="all">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <input
        type="text"
        value={tag}
        onChange={handleTagChange}
        onKeyPress={handleTagKeyPress}
        placeholder="Filter by tag..."
        className="border rounded-lg px-3 py-1.5 text-sm flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />

      <button
        onClick={handleClear}
        className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
