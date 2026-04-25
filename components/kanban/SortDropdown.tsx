'use client';

import { useState, useRef, useEffect } from 'react';
import { DefectStatus, SortField, SortDirection } from '@/types';

interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
  icon: string;
}

const sortOptions: SortOption[] = [
  { field: 'defectNumber', direction: 'asc', label: 'Defect Number (A-Z)', icon: '🔢' },
  { field: 'defectNumber', direction: 'desc', label: 'Defect Number (Z-A)', icon: '🔢' },
  { field: 'createdAt', direction: 'desc', label: 'Date Created (Newest)', icon: '📅' },
  { field: 'createdAt', direction: 'asc', label: 'Date Created (Oldest)', icon: '📅' },
  { field: 'updatedAt', direction: 'desc', label: 'Date Updated (Recent)', icon: '🔄' },
  { field: 'updatedAt', direction: 'asc', label: 'Date Updated (Oldest)', icon: '🔄' },
  { field: 'severity', direction: 'desc', label: 'Severity (Critical → Low)', icon: '⚠️' },
  { field: 'severity', direction: 'asc', label: 'Severity (Low → Critical)', icon: '⚠️' },
  { field: 'title', direction: 'asc', label: 'Title (A-Z)', icon: '📝' },
  { field: 'title', direction: 'desc', label: 'Title (Z-A)', icon: '📝' },
  { field: 'sortOrder', direction: 'asc', label: 'Custom Order (Manual)', icon: '✋' },
];

interface SortDropdownProps {
  status: DefectStatus;
  currentSort: { field: SortField; direction: SortDirection };
  onSortChange: (status: DefectStatus, field: SortField, direction: SortDirection) => void;
}

export function SortDropdown({ status, currentSort, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = sortOptions.find(
    (opt) => opt.field === currentSort.field && opt.direction === currentSort.direction
  ) || sortOptions[0];

  const handleSelect = (option: SortOption) => {
    onSortChange(status, option.field, option.direction);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        title={`Sorted by: ${currentOption.label}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200/60 py-1 z-50 overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium text-slate-400 border-b border-slate-100">
            Sort by
          </div>
          {sortOptions.map((option) => (
            <button
              key={`${option.field}-${option.direction}`}
              onClick={() => handleSelect(option)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors ${
                currentSort.field === option.field && currentSort.direction === option.direction
                  ? 'bg-slate-50 text-slate-900 font-medium'
                  : 'text-slate-600'
              }`}
            >
              <span className="w-4 text-center text-xs">{option.icon}</span>
              <span className="flex-1">{option.label}</span>
              {currentSort.field === option.field && currentSort.direction === option.direction && (
                <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
