# Modal State Management — Technical Architecture

**Project**: 6 Harmony Street Defect Tracker  
**Feature**: In-Modal Status Change with Confirmation  
**Document Version**: 1.0  
**Created**: 2026-04-24  
**Author**: ArchitectUX  

---

## 1. Design Principles

This architecture follows the existing codebase patterns:

- **No global state library** — keep state local to `DefectDetailModal`
- **No new form/validation libraries** — use native React state + Zod on server
- **Minimal dependencies** — only `lucide-react` for icons (already standard in Next.js/Tailwind ecosystem)
- **Custom lightweight components** — no Radix/Headless UI overhead; build simple accessible dropdowns and dialogs from scratch matching the existing modal pattern
- **Consistent with existing patterns** — same `fixed inset-0` modals, same `useState` approach, same `fetch()` API calls

---

## 2. Component Design

### 2.1 Component Overview

```
components/
├── kanban/
│   ├── DefectDetailModal.tsx      # MODIFY — add status selector + confirmation
│   ├── StatusSelector.tsx         # NEW — dropdown with status options
│   └── StatusConfirmationDialog.tsx # NEW — confirmation overlay
├── ui/
│   ├── StatusBadge.tsx            # NEW — reusable colored badge
│   └── Toast.tsx                  # NEW — toast notification system
└── ...
lib/
└── status.ts                      # NEW — constants, types, validation
```

### 2.2 StatusBadge Component

**File**: `components/ui/StatusBadge.tsx`

A reusable badge that displays the current defect status with appropriate colors. Extracts the inline status badge logic currently embedded in `DefectDetailModal.tsx` and `KanbanBoard.tsx` (mobile tabs).

```typescript
interface StatusBadgeProps {
  status: DefectStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  isLoading?: boolean;
  className?: string;
}
```

**Implementation Details**:
- Uses `STATUS_METADATA` from `lib/status.ts` for colors, icons, labels
- Size variants: `sm` (text-xs, px-2 py-0.5), `md` (text-sm, px-3 py-1), `lg` (text-base, px-4 py-1.5)
- When `isLoading=true`: shows a small `Loader2` spinner after the label, text changes to "Saving..."
- Uses `cn()` from `@/lib/utils/helpers` for class merging
- Icon via `lucide-react`: `Circle` (TODO), `Loader2` (IN_PROGRESS), `CheckCircle2` (DONE)

**Usage Sites** (replaces existing inline patterns):
1. `DefectDetailModal.tsx` — header badge
2. `KanbanBoard.tsx` — mobile tab labels
3. `StatusSelector.tsx` — trigger button display
4. `StatusConfirmationDialog.tsx` — from/to status display
5. `KanbanColumn.tsx` — column header (optional, for consistency)

### 2.3 StatusSelector Component

**File**: `components/kanban/StatusSelector.tsx`

A custom dropdown that shows the current status as a trigger button and reveals valid next states on click.

```typescript
interface StatusSelectorProps {
  currentStatus: DefectStatus;
  onChange: (status: DefectStatus) => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Visual Design**:

```
┌──────────────────────────┐
│ ● In Progress       ▼    │  ← Trigger (closed)
└──────────────────────────┘

  Click opens:
┌──────────────────────────┐
│ ○ To Do            (current) │
│ ● In Progress             │  ← disabled (current)
│ ○ Done                    │  ← valid next state
└──────────────────────────┘
```

**Implementation Details**:
- **NOT a native `<select>`** — custom dropdown using `button` + `ul/li` for full Tailwind styling control
- **Dropdown positioning**: absolute positioned below trigger, right-aligned (matches header close button alignment)
- **Backdrop dismiss**: click outside closes dropdown (attach `useEffect` with `mousedown` listener on `document`)
- **Current state**: shown in dropdown but styled as disabled (opacity-50, cursor-not-allowed, with "(current)" label)
- **Valid next states**: from `STATUS_METADATA[currentStatus].nextStates`
- **Loading state**: trigger button shows spinner, dropdown disabled entirely
- **Keyboard navigation**:
  - `Tab` → focuses trigger
  - `Enter`/`Space` → opens dropdown, focuses first option
  - `ArrowUp`/`ArrowDown` → navigate options (skip disabled)
  - `Enter` → select focused option
  - `Escape` → close dropdown, return focus to trigger
- **ARIA**: `role="listbox"` on dropdown, `role="option"` on items, `aria-expanded`, `aria-selected`, `aria-disabled`
- **Z-index**: `z-60` (above modal content at `z-50`, below confirmation dialog at `z-70`)

**Internal State**:
```typescript
const [isOpen, setIsOpen] = useState(false);
const [focusedIndex, setFocusedIndex] = useState(-1);
```

### 2.4 StatusConfirmationDialog Component

**File**: `components/kanban/StatusConfirmationDialog.tsx`

A confirmation overlay that appears on top of the defect modal when a transition requires user confirmation.

```typescript
interface StatusConfirmationDialogProps {
  isOpen: boolean;
  fromStatus: DefectStatus;
  toStatus: DefectStatus;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**Visual Design**:

```
  Dark overlay on top of defect modal
┌─────────────────────────────────────┐
│                                     │
│   ┌─────────────────────────────┐   │
│   │  Change Defect Status?      │   │
│   │                             │   │
│   │  [To Do]  →  [Done]         │   │
│   │                             │   │
│   │  This will mark the defect  │   │
│   │  as resolved without moving │   │
│   │  through "In Progress".     │   │
│   │                             │   │
│   │  [Cancel]  [Confirm Change] │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Implementation Details**:
- **Positioning**: `fixed inset-0 z-[70]` — above defect modal (`z-50`) and status selector dropdown (`z-60`)
- **Backdrop**: `bg-black/60` — darker than defect modal backdrop (`bg-black/50`) to create layer depth
- **Dialog box**: centered, `max-w-md`, white bg, rounded-lg, shadow-2xl
- **Focus trap**: `useEffect` on mount to focus the "Cancel" button; `Tab` cycles between Cancel and Confirm only
- **Keyboard**:
  - `Enter` → triggers `onConfirm` (primary action)
  - `Escape` → triggers `onCancel`
- **Loading state**: Confirm button shows spinner and text "Confirming...", both buttons disabled
- **ARIA**: `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- **Animation**: Simple fade-in via CSS transition (`transition-opacity duration-200`)
- **Status badges in dialog**: uses `StatusBadge` component with `size="lg"` for clear from/to display

### 2.5 Toast Component

**File**: `components/ui/Toast.tsx`

A lightweight toast notification system. No external library — simple React state + CSS transitions.

```typescript
interface ToastOptions {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;  // ms, default 3000 for success, 5000 for error
  action?: { label: string; onClick: () => void };  // e.g., "Retry"
}

// Usage via ToastProvider + useToast() hook
```

**Implementation Approach**:

Since the project has no global state, use a **simple event-based toast** pattern with a single provider at the app root:

1. **ToastStore** (`lib/toast.ts`): A tiny module-scoped state with callbacks (no React needed for the store itself)
2. **ToastProvider** (`components/ui/Toast.tsx`): Renders toast(s) as fixed-position overlay, `z-[80]` (topmost)
3. **useToast hook**: Wraps the store for React components

**Simplified alternative** (if provider adds too much complexity): Pass a `onToast` callback from `KanbanBoard` down to `DefectDetailModal`. This matches the existing pattern of lifting state up.

**Recommended: Callback approach** — simpler, no new providers needed:

```typescript
// In KanbanBoard.tsx
const [toast, setToast] = useState<ToastData | null>(null);

// Pass down to DefectDetailModal
<DefectDetailModal
  defect={selectedDefect}
  isOpen={isModalOpen}
  onClose={handleCloseModal}
  onStatusChange={handleModalStatusChange}
  onToast={setToast}
/>

// Render toast at KanbanBoard level (sibling to modal)
{toast && <Toast data={toast} onDismiss={() => setToast(null)} />}
```

**Toast Visual**:
- Position: `fixed bottom-4 right-4 z-[80]`
- Success: green bg (`bg-green-600`), white text, checkmark icon
- Error: red bg (`bg-red-600`), white text, X icon, optional "Retry" button
- Auto-dismiss with `setTimeout`, manual dismiss with click
- Slide-in animation: `animate-slide-in` (custom Tailwind keyframe)

### 2.6 DefectDetailModal Modifications

**File**: `components/kanban/DefectDetailModal.tsx`

**Props additions**:
```typescript
interface DefectDetailModalProps {
  defect: Defect | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (updatedDefect: Defect) => void;  // NEW — notify parent of status change
  onToast?: (toast: ToastData) => void;               // NEW — trigger toast notifications
}
```

**New internal state**:
```typescript
const [isStatusUpdating, setIsStatusUpdating] = useState(false);
const [pendingStatus, setPendingStatus] = useState<DefectStatus | null>(null);
const [showConfirmation, setShowConfirmation] = useState(false);
const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
```

**Header JSX changes** (replace current header div):
```tsx
{/* Header */}
<div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
  <div className="flex-1 min-w-0 pr-4">
    <span className="text-sm font-mono text-gray-500">{defect.defectNumber}</span>
    <h2 className="text-xl font-bold text-gray-900 mt-1 truncate">{defect.title}</h2>
  </div>
  <div className="flex items-center gap-2 flex-shrink-0">
    <StatusSelector
      currentStatus={defect.status}
      onChange={handleStatusSelect}
      isLoading={isStatusUpdating}
      disabled={isStatusUpdating}
    />
    <button
      onClick={onClose}
      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      aria-label="Close"
    >
      {/* existing X icon SVG */}
    </button>
  </div>
</div>
```

**New handler functions** (added before the return statement):
```typescript
// Step 1: User selects a status from dropdown
const handleStatusSelect = (newStatus: DefectStatus) => {
  if (newStatus === defect.status) return;  // No-op for same status

  const validation = validateStatusTransition(defect.status, newStatus);
  if (!validation.valid) {
    onToast?.({ message: validation.error!, type: 'error' });
    return;
  }

  if (validation.requiresConfirmation) {
    setPendingStatus(newStatus);
    setShowConfirmation(true);
  } else {
    executeStatusChange(newStatus);
  }
};

// Step 2: Execute the actual API call
const executeStatusChange = async (newStatus: DefectStatus) => {
  const previousStatus = defect.status;
  setIsStatusUpdating(true);
  setShowConfirmation(false);

  // Optimistic update
  const updatedDefect = { ...defect, status: newStatus };
  // Note: defect is a prop, so we notify parent immediately
  onStatusChange?.(updatedDefect);

  try {
    const response = await fetch(`/api/defects/${defect.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to update status');
    }

    // Server confirmed — notify parent with server data
    onStatusChange?.(result.data);
    onToast?.({
      message: `Status updated to ${STATUS_METADATA[newStatus].label}`,
      type: 'success',
    });
  } catch (error) {
    // Rollback: notify parent with previous status
    onStatusChange?.({ ...defect, status: previousStatus });
    onToast?.({
      message: 'Failed to update status. Please try again.',
      type: 'error',
      action: {
        label: 'Retry',
        onClick: () => executeStatusChange(newStatus),
      },
    });
  } finally {
    setIsStatusUpdating(false);
    setPendingStatus(null);
  }
};
```

**Confirmation dialog rendering** (add before closing `</>`):
```tsx
{/* Status Confirmation Dialog */}
{pendingStatus && (
  <StatusConfirmationDialog
    isOpen={showConfirmation}
    fromStatus={defect.status}
    toStatus={pendingStatus}
    onConfirm={() => executeStatusChange(pendingStatus)}
    onCancel={() => {
      setShowConfirmation(false);
      setPendingStatus(null);
    }}
    isLoading={isStatusUpdating}
  />
)}
```

---

## 3. State Management

### 3.1 Approach: Local State with Parent Notification

The codebase uses **local component state** exclusively. This feature continues that pattern:

```
KanbanBoard (owns defect data)
    │
    ├── defects: Defect[]  (main list state)
    │
    └── DefectDetailModal (owns UI state)
            │
            ├── isStatusUpdating: boolean
            ├── pendingStatus: DefectStatus | null
            ├── showConfirmation: boolean
            │
            └── onStatusChange(updatedDefect) → updates KanbanBoard.defects
```

**Why not React Query / Zustand / Context**:
- The project has zero global state libraries currently
- Adding one for a single feature would be over-engineering
- The parent-notify pattern (`onStatusChange` callback) already exists in the codebase for drag-and-drop status changes
- Consistency > convenience for this codebase stage

### 3.2 Optimistic Update Strategy

**Pattern**: Notify parent immediately with optimistic data, then reconcile with server response.

```
1. User confirms status change
2. DefectDetailModal calls onStatusChange({ ...defect, status: NEW })
3. KanbanBoard updates its defects array immediately (UI updates)
4. DefectDetailModal fires PATCH request
5a. SUCCESS: onStatusChange(serverData) — reconcile with server timestamps
5b. ERROR: onStatusChange({ ...defect, status: PREVIOUS }) — rollback
```

**KanbanBoard's `handleModalStatusChange`**:
```typescript
const handleModalStatusChange = useCallback((updatedDefect: Defect) => {
  setDefects(prev =>
    prev.map(d => d.id === updatedDefect.id ? updatedDefect : d)
  );
  // Also update selectedDefect so modal shows correct data
  setSelectedDefect(prev =>
    prev && prev.id === updatedDefect.id ? updatedDefect : prev
  );
}, []);
```

**Key insight**: The existing `handleStatusChange` in `KanbanBoard` (used by drag-and-drop) already does `fetchDefects()` (full re-fetch). For modal updates, we use optimistic update + targeted single-defect replacement, which is faster and smoother. Consider refactoring the drag handler to also use optimistic updates in a future phase.

### 3.3 Error Handling & Rollback

| Error Type | Client Action | User Feedback |
|------------|---------------|---------------|
| Invalid transition | Block before API call | Error toast with validation message |
| Network error | Rollback to previous status | Error toast with "Retry" button |
| 400 Bad Request | Rollback to previous status | Error toast with server error message |
| 404 Not Found | Rollback to previous status | Error toast: "Defect not found" |
| 500 Server Error | Rollback to previous status | Error toast with "Retry" button |
| User closes modal during save | Let API call complete in background | No visible feedback (data will be stale on next open, auto-fixed by refetch) |

**Race condition protection**: The `isStatusUpdating` flag disables the status selector while an update is in progress, preventing double-submissions.

---

## 4. Status Constants & Validation

### 4.1 New File: `lib/status.ts`

Central source of truth for all status-related logic. No dependencies.

```typescript
// lib/status.ts
import type { DefectStatus } from '@/types';

export interface StatusMetadata {
  label: string;
  colorClass: string;
  colorClassDark: string;
  icon: string;  // Lucide icon name (imported by consumers)
  description: string;
  nextStates: DefectStatus[];
}

export const STATUS_METADATA: Record<DefectStatus, StatusMetadata> = {
  TODO: {
    label: 'To Do',
    colorClass: 'bg-amber-100 text-amber-800 border-amber-200',
    colorClassDark: 'dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    icon: 'Circle',
    description: 'Defect has been identified but work has not started',
    nextStates: ['IN_PROGRESS', 'DONE'],
  },
  IN_PROGRESS: {
    label: 'In Progress',
    colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
    colorClassDark: 'dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    icon: 'Loader2',
    description: 'Work is currently being done on this defect',
    nextStates: ['TODO', 'DONE'],
  },
  DONE: {
    label: 'Done',
    colorClass: 'bg-green-100 text-green-800 border-green-200',
    colorClassDark: 'dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    icon: 'CheckCircle2',
    description: 'Defect has been resolved and verified',
    nextStates: ['TODO', 'IN_PROGRESS'],
  },
};

export const REQUIRES_CONFIRMATION: Record<DefectStatus, DefectStatus[]> = {
  TODO: ['DONE'],
  IN_PROGRESS: ['TODO'],
  DONE: ['TODO', 'IN_PROGRESS'],
};

export const CONFIRMATION_MESSAGES: Record<string, string> = {
  'TODO->DONE': 'This will mark the defect as resolved without moving through "In Progress".',
  'IN_PROGRESS->TODO': 'This will move the defect back to "To Do".',
  'DONE->IN_PROGRESS': 'This will reopen the defect for additional work.',
  'DONE->TODO': 'This will reopen the defect and reset to "To Do".',
};

export interface ValidationResult {
  valid: boolean;
  requiresConfirmation?: boolean;
  error?: string;
}

export function validateStatusTransition(
  fromStatus: DefectStatus,
  toStatus: DefectStatus,
): ValidationResult {
  if (fromStatus === toStatus) {
    return { valid: false, error: 'Cannot change to the same status' };
  }

  const allowedNext = STATUS_METADATA[fromStatus].nextStates;
  if (!allowedNext.includes(toStatus)) {
    return { valid: false, error: `Cannot transition from ${STATUS_METADATA[fromStatus].label} to ${STATUS_METADATA[toStatus].label}` };
  }

  const requiresConfirm = REQUIRES_CONFIRMATION[fromStatus]?.includes(toStatus) ?? false;
  return { valid: true, requiresConfirmation: requiresConfirm };
}

export function getConfirmationMessage(
  fromStatus: DefectStatus,
  toStatus: DefectStatus,
): string {
  const key = `${fromStatus}->${toStatus}`;
  return CONFIRMATION_MESSAGES[key] ?? `Change status from ${STATUS_METADATA[fromStatus].label} to ${STATUS_METADATA[toStatus].label}?`;
}
```

### 4.2 Toast Type

Add to `types/index.ts`:

```typescript
export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  action?: { label: string; onClick: () => void };
}
```

---

## 5. API Integration

### 5.1 Existing Endpoint (No Changes Required)

**PATCH `/api/defects/[id]`** at `app/api/defects/[id]/route.ts`

The existing endpoint already accepts `{ status: 'TODO' | 'IN_PROGRESS' | 'DONE' }` and returns the updated defect. No server-side changes needed for this feature.

### 5.2 Request/Response Types

**Request** (from modal):
```json
PATCH /api/defects/{uuid}
Content-Type: application/json

{ "status": "IN_PROGRESS" }
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "defectNumber": "DEF-001",
    "title": "Stormwater Drain Issue",
    "status": "IN_PROGRESS",
    "updatedAt": "2026-04-24T10:30:00Z"
    // ... all other fields
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to update defect"
}
```

### 5.3 Server-Side Validation Enhancement (Optional)

The existing PATCH handler already validates status via Zod. For audit trail readiness, add transition logging:

**File**: `app/api/defects/[id]/route.ts` — inside PATCH handler, after `existing` is fetched:

```typescript
// Optional: Log status transitions for audit trail
if (validated.status && validated.status !== existing.status) {
  console.log(
    `[AUDIT] Status change: ${existing.status} -> ${validated.status} for defect ${existing.defectNumber} (${id})`,
  );
  // Future: insert into status_transitions table
}
```

This is a one-line addition with zero risk — just a console.log. The full audit trail with a database table can be added later.

---

## 6. File Structure

### 6.1 New Files to Create

| File | Purpose | Lines (est.) |
|------|---------|-------------|
| `lib/status.ts` | Status constants, metadata, validation | ~60 |
| `components/ui/StatusBadge.tsx` | Reusable status badge | ~40 |
| `components/ui/Toast.tsx` | Toast notification component + hook | ~80 |
| `components/kanban/StatusSelector.tsx` | Status dropdown selector | ~120 |
| `components/kanban/StatusConfirmationDialog.tsx` | Confirmation dialog overlay | ~100 |

### 6.2 Files to Modify

| File | Changes | Lines (est.) |
|------|---------|-------------|
| `components/kanban/DefectDetailModal.tsx` | Add imports, new state, handlers, header redesign, confirmation dialog | +80 |
| `components/kanban/KanbanBoard.tsx` | Add `onStatusChange`/`onToast` props to modal, add toast state/rendering | +30 |
| `types/index.ts` | Add `ToastData` interface | +8 |
| `app/globals.css` | Add toast slide-in keyframe animation | +10 |

### 6.3 No New Dependencies

**Exception**: `lucide-react` — needed for status icons. This is the standard icon library for Next.js + Tailwind projects.

```bash
npm install lucide-react
```

**No other dependencies required**. No toast library, no dropdown library, no state management library. All custom lightweight components.

---

## 7. Implementation Steps

### Phase 1: Foundation (lib + types + badge)

**Step 1**: Install `lucide-react`
```bash
cd projects/harmony-defect-tracker
npm install lucide-react
```

**Step 2**: Create `lib/status.ts`
- Copy the full implementation from Section 4.1
- No dependencies, no imports except `@/types`
- Verify: `npx tsc --noEmit` passes

**Step 3**: Add `ToastData` to `types/index.ts`
- Add interface from Section 4.2

**Step 4**: Create `components/ui/StatusBadge.tsx`
- Implement the badge component
- Test: Render with each status variant, verify colors/icons
- Verify: Badge matches existing inline badge styling in `DefectDetailModal`

### Phase 2: Core Components (Selector + Dialog)

**Step 5**: Create `components/kanban/StatusSelector.tsx`
- Implement dropdown with keyboard navigation
- Test: Open/close, select options, keyboard navigation, ARIA attributes
- Verify: Dropdown renders valid next states only, current state is disabled

**Step 6**: Create `components/kanban/StatusConfirmationDialog.tsx`
- Implement dialog with focus trap
- Test: Open/close, confirm/cancel, keyboard (Enter/Escape), focus trap
- Verify: Correct transition message displayed for each transition type

### Phase 3: Toast System

**Step 7**: Create `components/ui/Toast.tsx`
- Implement toast component with auto-dismiss
- Add slide-in animation to `app/globals.css`:
```css
@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in {
  animation: slide-in-right 0.3s ease-out;
}
```
- Test: Success toast auto-dismisses at 3s, error toast at 5s, action button works

### Phase 4: Modal Integration

**Step 8**: Modify `components/kanban/DefectDetailModal.tsx`
- Add imports for new components
- Add new state variables
- Add `handleStatusSelect` and `executeStatusChange` handlers
- Replace header JSX with new layout (status selector + close button)
- Add `StatusConfirmationDialog` rendering
- Add `onStatusChange` and `onToast` props to interface
- Test: Open modal → status selector visible → change status → optimistic update → server confirmation

**Step 9**: Modify `components/kanban/KanbanBoard.tsx`
- Add `toast` state
- Create `handleModalStatusChange` callback
- Pass `onStatusChange` and `onToast` to `DefectDetailModal`
- Add `<Toast>` rendering
- Test: Full flow from kanban → modal → status change → kanban updates

### Phase 5: Polish & Testing

**Step 10**: Keyboard navigation audit
- Test all keyboard flows: Tab through modal, open selector, navigate options, confirm dialog
- Verify focus returns correctly after each interaction

**Step 11**: Mobile responsive test
- Test on viewport < 640px
- Verify status selector is touch-friendly (min 44px tap targets)
- Verify confirmation dialog fits on small screens

**Step 12**: Error scenario testing
- Test network failure (use browser dev tools to throttle/offline)
- Test invalid status (manually modify state in dev tools)
- Test rapid double-click on status change
- Verify rollback works correctly in all error cases

---

## 8. Testing Approach

### 8.1 Unit Tests (When testing framework is added)

**`lib/status.test.ts`**:
- `validateStatusTransition('TODO', 'IN_PROGRESS')` → `{ valid: true, requiresConfirmation: false }`
- `validateStatusTransition('TODO', 'DONE')` → `{ valid: true, requiresConfirmation: true }`
- `validateStatusTransition('TODO', 'TODO')` → `{ valid: false, error: ... }`
- `getConfirmationMessage('TODO', 'DONE')` → correct message string
- All 6 valid transitions produce correct `requiresConfirmation` values

**`StatusBadge.test.tsx`**:
- Renders with correct label and color class for each status
- Shows icon when `showIcon={true}`
- Shows spinner when `isLoading={true}`
- Applies custom `className` via `cn()`

**`StatusSelector.test.tsx`**:
- Displays current status in trigger button
- Dropdown shows exactly 2 valid next states + current state (disabled)
- Clicking a valid state calls `onChange` with correct value
- Clicking current state does nothing
- Loading state disables all interaction

**`StatusConfirmationDialog.test.tsx`**:
- Shows correct from/to badges
- Shows correct confirmation message
- `onConfirm` called when Confirm clicked
- `onCancel` called when Cancel clicked
- Escape key triggers `onCancel`

### 8.2 Manual Testing Checklist

```
□ Open defect modal → status selector visible in header
□ Click selector → dropdown opens with valid options
□ Select "In Progress" from "To Do" → updates immediately (no confirmation)
□ Select "Done" from "To Do" → confirmation dialog appears
□ Confirm in dialog → status updates, success toast appears
□ Cancel in dialog → dialog closes, status unchanged
□ During update: selector is disabled
□ Network error: status reverts, error toast with retry appears
□ Retry from toast: re-attempts API call
□ Close modal during update: no crash, data reconciles on next open
□ Keyboard: Tab, Enter, Arrow keys all work in selector
□ Keyboard: Enter confirms, Escape cancels in dialog
□ Mobile: tap targets are 44px minimum
□ Mobile: dialog fits on small screen
```

### 8.3 Integration with Existing Drag-and-Drop

After this feature is implemented, status changes can happen via two paths:
1. **Drag-and-drop** on kanban columns (existing, via `handleStatusChange` in `KanbanBoard`)
2. **Modal status selector** (new, via `handleModalStatusChange` in `KanbanBoard`)

Both update the same `defects` state array in `KanbanBoard`, ensuring consistency. The kanban board will automatically reflect modal changes because both paths call `setDefects()` with the updated defect.

**Future improvement**: Consider having the drag-and-drop path also use optimistic updates instead of full re-fetch (`fetchDefects()`), for consistency and performance.

---

## 9. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        KanbanBoard                           │
│                                                              │
│  defects: Defect[] ──────────────────────────────────┐       │
│  selectedDefect: Defect | null ─────────────┐        │       │
│  isModalOpen: boolean ──────────────┐       │        │       │
│  toast: ToastData | null ─────┐     │       │        │       │
│                               │     │       │        │       │
│  ┌────────────────────────────┼─────┼───────┼────────┘       │
│  │  handleModalStatusChange() │     │       │                │
│  │    → setDefects(map)       │     │       │                │
│  │    → setSelectedDefect     │     │       │                │
│  │                            │     │       │                │
│  │  handleToast() ────────────┘     │       │                │
│  │    → setToast()                  │       │                │
│  └──────────────────────────────────┘       │                │
│                              │              │                │
│  ┌───────────────────────────▼──────────────┘                │
│  │  DefectDetailModal                                        │
│  │    defect={selectedDefect}                                │
│  │    onStatusChange={handleModalStatusChange}               │
│  │    onToast={setToast}                                     │
│  │                                                           │
│  │  ┌─────────────────┐    ┌──────────────────────────────┐ │
│  │  │ StatusSelector  │    │ StatusConfirmationDialog     │ │
│  │  │ onChange=       │    │ isOpen={showConfirmation}    │ │
│  │  │ handleStatus    │    │ fromStatus={defect.status}   │ │
│  │  │ Select()        │    │ toStatus={pendingStatus}     │ │
│  │  │                 │    │ onConfirm=executeStatusChng()│ │
│  │  └─────────────────┘    │ onCancel=cancelConfirm()     │ │
│  │                         └──────────────────────────────┘ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                                │
│                    fetch PATCH /api/defects/:id               │
│                              │                                │
│  ┌───────────────────────────▼──────────────────────────────┐│
│  │  Toast                                                   ││
│  │    Success: "Status updated to In Progress"              ││
│  │    Error: "Failed to update" + [Retry]                   ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Z-Index Stack

| Component | Z-Index | Notes |
|-----------|---------|-------|
| KanbanBoard | default | Base layer |
| DefectDetailModal | `z-50` | Existing |
| StatusSelector dropdown | `z-60` | Above modal content |
| StatusConfirmationDialog | `z-[70]` | Above selector and modal |
| Toast | `z-[80]` | Topmost layer |

This ensures proper layering: modal → dropdown → confirmation → toast.

---

## 11. Accessibility Summary

| Feature | Implementation |
|---------|---------------|
| Keyboard nav | Full Tab/Enter/Arrow/Escape support in selector and dialog |
| Focus trap | Confirmation dialog traps focus between Cancel/Confirm |
| ARIA roles | `listbox`/`option` for dropdown, `alertdialog` for confirmation |
| Screen reader | Status changes announced via toast messages |
| Focus management | Focus returns to selector after dialog closes |
| Color contrast | All badge color classes meet WCAG AA (tested with amber/blue/green on white) |
| Touch targets | All interactive elements minimum 44px height on mobile |

---

## 12. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Dropdown click-outside doesn't close | Low | Low | `useEffect` with `mousedown` listener on document |
| Focus trap broken in confirmation dialog | Medium | Medium | Test with Tab/Shift+Tab; ensure only 2 focusable elements |
| Toast overlaps with other fixed elements | Low | Low | Fixed position at bottom-right with sufficient margin |
| Optimistic update conflicts with drag-and-drop | Medium | High | Both update same state via `setDefects` — last write wins (acceptable for now) |
| `lucide-react` bundle size impact | Low | Low | Icons are tree-shaken; only imported icons included |
| Mobile dropdown positioning off-screen | Medium | Low | Use fixed positioning with max-width and centering fallback |

---

## 13. Future Enhancements (Out of Scope for MVP)

1. **React Query integration** — Replace manual fetch calls with `useMutation` for automatic caching, retries, and optimistic updates
2. **Status transition audit log** — Database table tracking who changed what and when
3. **Bulk status change** — Select multiple defects, change all at once
4. **Custom states** — Configurable status types beyond TODO/IN_PROGRESS/DONE
5. **WebSocket real-time updates** — Push status changes to all connected clients
6. **Undo** — 5-second undo window after status change

---

**End of Document**
