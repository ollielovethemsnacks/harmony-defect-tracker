'use client';

import { useCallback, useRef } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { DefectStatus } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  DEFECT_STATUSES,
  statusMetadata,
  isValidStatusTransition,
} from '@/lib/status';

export interface StatusSelectorProps {
  currentStatus: DefectStatus;
  onChange: (status: DefectStatus) => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusSelector({
  currentStatus,
  onChange,
  isLoading = false,
  disabled = false,
  size = 'md',
}: StatusSelectorProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleSelect = useCallback(
    (status: DefectStatus) => {
      if (status === currentStatus) return;
      if (!isValidStatusTransition(currentStatus, status)) return;
      onChange(status);
    },
    [currentStatus, onChange],
  );

  const badgeSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          ref={triggerRef}
          disabled={disabled || isLoading}
          className={`
            inline-flex items-center gap-1.5
            min-h-[44px] min-w-[44px]
            px-2 py-1.5
            sm:min-h-0 sm:min-w-0
            rounded-lg border border-gray-200 bg-white
            hover:bg-gray-50
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            w-full sm:w-auto
          `}
          aria-label={`Change status from ${statusMetadata[currentStatus].label}`}
          aria-haspopup="listbox"
        >
          <StatusBadge
            status={currentStatus}
            size={badgeSize}
            isLoading={isLoading}
          />
          {isLoading ? (
            <Loader2
              width={16}
              height={16}
              className="animate-spin text-gray-400"
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              width={16}
              height={16}
              className="text-gray-400"
              aria-hidden="true"
            />
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="w-56 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 focus:outline-none max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto"
          sideOffset={4}
          align="end"
          collisionPadding={8}
          aria-label="Select status"
          role="listbox"
        >
          {DEFECT_STATUSES.map((status) => {
            const isCurrent = status === currentStatus;
            const isValid = isValidStatusTransition(currentStatus, status);

            return (
              <DropdownMenu.Item
                key={status}
                className={`
                  flex items-center gap-2 min-h-[44px] px-3 text-sm cursor-default
                  ${isCurrent ? 'bg-gray-50 text-gray-400' : isValid ? 'text-gray-900 hover:bg-blue-50 focus-visible:bg-blue-50' : 'text-gray-300 cursor-not-allowed'}
                  focus-visible:outline-none focus-visible:bg-blue-50
                `}
                disabled={!isValid || isCurrent}
                onSelect={() => handleSelect(status)}
                role="option"
                aria-selected={isCurrent}
                data-current={isCurrent ? '' : undefined}
              >
                <StatusBadge status={status} size="sm" showIcon={true} />
                {!isValid && !isCurrent && (
                  <span className="ml-auto text-xs text-gray-300 italic">
                    invalid
                  </span>
                )}
                {isCurrent && (
                  <span className="ml-auto text-xs text-gray-400 font-medium">
                    current
                  </span>
                )}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
