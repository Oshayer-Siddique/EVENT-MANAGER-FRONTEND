'use client';

import { useState, useEffect } from 'react';

interface ChecklistItem {
  id: string;
  name: string;
}

interface ChecklistProps {
  items: ChecklistItem[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  title: string;
}

export function Checklist({ items, selectedIds, onChange, title }: ChecklistProps) {
  const [currentSelectedIds, setCurrentSelectedIds] = useState<string[]>(selectedIds || []);

  useEffect(() => {
    setCurrentSelectedIds(selectedIds || []);
  }, [selectedIds]);

  const handleCheckboxChange = (itemId: string) => {
    const newSelectedIds = currentSelectedIds.includes(itemId)
      ? currentSelectedIds.filter(id => id !== itemId)
      : [...currentSelectedIds, itemId];
    setCurrentSelectedIds(newSelectedIds);
    onChange(newSelectedIds);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold leading-7 text-gray-900">{title}</h2>
      <div className="mt-2 h-32 overflow-y-auto border rounded-md p-2">
        {items.map(item => (
          <label key={item.id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-md">
            <input
              type="checkbox"
              checked={currentSelectedIds.includes(item.id)}
              onChange={() => handleCheckboxChange(item.id)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">{item.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
