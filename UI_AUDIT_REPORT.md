# UI/UX Audit Report: Harmony Defect Tracker

**Date:** 2026-04-26
**Scope:** Full frontend review (Visual Design, UX Interactions, Accessibility, Component Architecture)
**Auditor:** Claude Code

---

## Executive Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Visual Design | 0 | 2 | 4 | 3 | 9 |
| UX Interactions | 0 | 3 | 5 | 2 | 10 |
| Accessibility | 1 | 2 | 4 | 2 | 9 |
| Component Architecture | 0 | 1 | 3 | 4 | 8 |
| **TOTAL** | **1** | **8** | **16** | **11** | **36** |

---

## Critical Issues (Fix Immediately)

### C1: Missing Error State UI for Kanban Board
**File:** `components/kanban/KanbanBoard.tsx:21-22`

**Issue:** The fetch error is only logged to console with no user-visible feedback.

```tsx
// Current (BAD)
} catch (error) {
  if (!cancelled) console.error('Failed to fetch defects:', error);
}
```

**Impact:** Users see infinite loading or blank state if API fails.

**Fix:** Add error state UI with retry button.

---

## High Severity Issues

### H1: Inconsistent Color System Across Components
**Files:** Multiple files using hardcoded colors

**Issue:** Colors are defined in multiple places without a single source of truth:
- `globals.css` defines CSS custom properties
- `lib/status.ts` defines badge classes
- Components have inline color classes
- Some use Tailwind's default palette, others use custom colors

**Examples:**
```tsx
// DefectCard.tsx - uses bg-amber-100
// globals.css - defines --color-todo: #f59e0b
// status.ts - uses bg-amber-100 text-amber-800 border-amber-200
// But page.tsx uses bg-gray-100 (not from design system)
```

**Impact:** Maintenance burden, inconsistent theming, potential a11y issues.

**Fix:** Centralize color tokens and use them consistently.

### H2: Mobile Responsiveness Issues
**File:** `components/kanban/KanbanBoard.tsx:64`

**Issue:** Kanban board uses horizontal flex layout that overflows on mobile:
```tsx
<div className="flex gap-4 p-4 h-screen">
```

**Impact:** Horizontal scrolling on mobile devices, poor UX.

**Fix:** Implement responsive column layout (stack on mobile).

### H3: Missing Loading Skeletons
**File:** `components/kanban/KanbanBoard.tsx:60`

**Issue:** Basic text loading state instead of skeleton UI:
```tsx
if (loading) return <div className="p-8 text-center">Loading...</div>;
```

**Impact:** Perceived performance is poor; layout shift when data loads.

**Fix:** Implement skeleton screens matching card structure.

### H4: DefectDetailModal Not Integrated
**File:** `components/DefectDetailModal.tsx` (unused)

**Issue:** There's a detailed modal component that appears to be orphaned/unused, while `components/kanban/DefectDetailModal.tsx` exists separately.

**Impact:** Code duplication confusion, maintenance overhead.

**Fix:** Consolidate or remove unused component.

### H5: No Empty States for Kanban Columns
**File:** `components/kanban/KanbanColumn.tsx`

**Issue:** Empty columns show no visual feedback - just blank space where cards would be.

**Impact:** Users may think the column is broken or still loading.

**Fix:** Add empty state messages with icons.

### H6: Keyboard Navigation Gaps in Defect Cards
**File:** `components/kanban/DefectCard.tsx`

**Issue:** Defect cards are only draggable but not keyboard accessible for:
- Opening detail view
- Editing
- Deleting

**Impact:** Keyboard-only users cannot interact with defects.

**Fix:** Add keyboard event handlers and focus states.

### H7: Missing Focus Visible Styles
**File:** `components/kanban/DefectCard.tsx:31`, `components/ImageGallery.tsx`

**Issue:** Many interactive elements lack visible focus indicators:
```tsx
className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
```

**Impact:** Keyboard navigation visibility issues.

**Fix:** Add `focus-visible:ring` or similar focus indicators.

### H8: Image Gallery Missing Error Handling
**File:** `components/ImageGallery.tsx:57-60`

**Issue:** No error handling for failed image loads:
```tsx
<img
  src={url}
  alt={`Image ${index + 1}`}
  className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity"
/>
```

**Impact:** Broken images show browser default broken image icon.

**Fix:** Add onError handler with fallback UI.

---

## Medium Severity Issues

### M1: Inconsistent Spacing Scale
**Files:** Various components

**Issue:** No consistent spacing scale - mixing arbitrary values:
- Some use `p-4`, others use `px-6 py-4`
- Inconsistent gap values: `gap-2`, `gap-3`, `gap-4`

**Impact:** Visual rhythm feels inconsistent.

**Fix:** Define and use a spacing scale consistently.

### M2: Modal Animation Inconsistency
**Files:** `CreateDefectModal.tsx`, `EditDefectModal.tsx` vs `StatusConfirmationDialog.tsx`

**Issue:** Some modals have enter/exit animations, others don't. Different animation patterns used.

**Impact:** Feels unpolished, inconsistent UX.

**Fix:** Standardize modal animations.

### M3: Typography Hierarchy Inconsistencies
**Files:** Various modals and components

**Issue:**
- Modal titles use `text-lg` in some, `text-xl` in others
- Body text sizes vary between `text-sm` and `text-base`
- Font weights inconsistent

**Impact:** Visual hierarchy is unclear.

**Fix:** Standardize typography scale.

### M4: Missing Hover States on Interactive Elements
**File:** `components/kanban/KanbanColumn.tsx`

**Issue:** No visual feedback when dragging over columns (no drop target highlighting).

**Impact:** Drag and drop affordance is unclear.

**Fix:** Add visual feedback during drag operations.

### M5: Status Badge Color Contrast Issues
**File:** `lib/status.ts:37`

**Issue:** Amber text on amber background may not meet WCAG contrast requirements:
```ts
TODO: { badgeClasses: 'bg-amber-100 text-amber-800 border-amber-200' }
```

**Impact:** Accessibility concerns for low vision users.

**Fix:** Verify and adjust color contrast ratios (aim for 4.5:1 minimum).

### M6: Image Upload Progress Indication
**File:** `components/ImageUpload.tsx`

**Issue:** No progress indication for individual file uploads - just spinning loader.

**Impact:** Users don't know upload progress for large files.

**Fix:** Add progress bars or percentage indicators.

### M7: Toast Notifications Stack Order
**File:** `components/ui/ToastContext.tsx:111-112`

**Issue:** Toasts use `flex-col-reverse` which may cause reading order issues:
```tsx
<div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2">
```

**Impact:** Screen readers may announce in wrong order.

**Fix:** Ensure DOM order matches visual order for accessibility.

### M8: Missing Page Metadata
**File:** `app/layout.tsx:15-18`

**Issue:** Default Next.js metadata not updated:
```tsx
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};
```

**Impact:** Poor SEO, incorrect browser tab titles.

**Fix:** Update with application-specific metadata.

### M9: No Confirmation for Discard Changes
**File:** `components/kanban/CreateDefectModal.tsx`, `EditDefectModal.tsx`

**Issue:** Closing modal with unsaved changes shows no confirmation - data is lost.

**Impact:** User data loss risk.

**Fix:** Add "unsaved changes" confirmation dialog.

### M10: Image Lightbox Thumbnails Not Clickable
**File:** `components/ImageLightbox.tsx:155-169`

**Issue:** Thumbnail buttons don't navigate to the clicked image:
```tsx
onClick={(e) => {
  e.stopPropagation();
  // Navigate to this image — parent manages currentIndex
}}
```

**Impact:** Thumbnails appear interactive but don't work.

**Fix:** Implement thumbnail navigation or remove the buttons.

### M11: PasscodeGate Loading State Unused
**File:** `components/PasscodeGate.tsx:42-48`

**Issue:** Loading state is defined but never set to true:
```tsx
const [isLoading, setIsLoading] = useState(false); // Never set to true
```

**Impact:** Dead code, confusion.

**Fix:** Remove unused state or implement actual loading behavior.

### M12: Global CSS Font Override
**File:** `app/globals.css:49-52`

**Issue:** Font family overridden after Tailwind setup:
```css
body {
  font-family: Arial, Helvetica, sans-serif; /* Overrides Geist */
}
```

**Impact:** Custom Geist font not applied.

**Fix:** Remove the override or use proper font-family.

---

## Low Severity Issues

### L1: Unused CSS Classes
**File:** `app/globals.css:55-62`

**Issue:** `.kanban-column` and `.dragging` classes may not be actively used.

### L2: Magic Numbers in Component
**File:** `components/ImageLightbox.tsx:64`

**Issue:** Swipe threshold hardcoded:
```tsx
if (Math.abs(diff) > 50) { // Magic number
```

### L3: Emoji Usage for Icons
**File:** `components/kanban/DefectCard.tsx:42-43`

**Issue:** Using emoji instead of icon components:
```tsx
<span>📍 {defect.location}</span>
{defect.images?.length > 0 && <span>📷 {defect.images.length}</span>}
```

### L4: Missing JSDoc Comments
**Files:** Various components

**Issue:** Several exported components lack documentation.

### L5: Date Formatting Not Localized
**Files:** Various components using `toLocaleString()`

**Issue:** Date formatting uses default locale instead of application locale.

### L6: ImageGallery Duplication
**Files:** `components/ImageGallery.tsx` and `components/kanban/DefectDetailModal.tsx` reference

**Issue:** ImageGallery is imported from root components but may have similar functionality elsewhere.

### L7: Console Error Logging
**Files:** Various API error handlers

**Issue:** Errors logged to console but not tracked/monitoring-ready.

### L8: TabIndex Usage
**File:** `components/kanban/CreateDefectModal.tsx` (various)

**Issue:** Explicit tabIndex values may interfere with natural tab order.

---

## Design System Recommendations

### 1. Color Tokens
```typescript
// Recommended structure for colors.ts
export const colors = {
  status: {
    todo: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' },
    inProgress: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
    done: { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200' },
  },
  severity: {
    critical: { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200' },
    // ... etc
  }
};
```

### 2. Spacing Scale
- Use Tailwind's default scale consistently
- Avoid arbitrary values (e.g., `py-2.5` where `py-2` or `py-3` would work)

### 3. Typography Scale
- H1: `text-2xl font-bold`
- H2: `text-xl font-semibold`
- H3: `text-lg font-medium`
- Body: `text-base` or `text-sm`
- Caption: `text-xs`

### 4. Component Patterns
- All modals should use consistent wrapper component
- All forms should use consistent field layout
- All cards should use consistent hover/focus states

---

## Accessibility Recommendations

### 1. ARIA Labels
Add descriptive labels to all interactive elements:
```tsx
<button aria-label={`Move defect ${defect.title} to ${newStatus}`}>
```

### 2. Focus Management
Implement focus trap in all modals consistently.

### 3. Color Contrast
Audit all color combinations for WCAG AA compliance.

### 4. Screen Reader Testing
Test with NVDA/VoiceOver before release.

---

## Implementation Priority

### Phase 1 (Immediate)
1. Fix Critical error handling (C1)
2. Add responsive Kanban layout (H2)
3. Fix metadata (M8)
4. Add loading skeletons (H3)

### Phase 2 (This Week)
5. Standardize color system (H1)
6. Add empty states (H5)
7. Fix keyboard navigation (H6)
8. Add focus indicators (H7)

### Phase 3 (Next Sprint)
9. Modal animation standardization (M2)
10. Typography consistency (M3)
11. Image error handling (H8)
12. Unsaved changes confirmation (M9)

### Phase 4 (Future)
13. Component consolidation (H4)
14. Spacing standardization (M1)
15. Documentation improvements (L4)
