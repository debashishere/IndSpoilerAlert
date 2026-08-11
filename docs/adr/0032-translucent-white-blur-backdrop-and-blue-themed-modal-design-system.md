# ADR 0032: Translucent White Blur Backdrop & Blue-Themed Modal Design System

- **Status**: Approved
- **Date**: 2026-08-11
- **Authors**: Antigravity AI & SpoilerAlert UI/UX Engineering Team
- **Deciders**: Frontend Architecture Lead, UI/UX Designer

---

## 1. Context & Problem Statement

Modal dialogs across complex enterprise web applications (such as workflow stage email configuration, buyer segment inspection, dynamic token settings, and pre-flight validation popups) often suffer from heavy, opaque dark backdrops (`rgba(0, 0, 0, 0.75)` or dark navy gradients). These dark overlays create stark visual contrast jarring to users, block context from the underlying application workspace, and can leave outer pages scrollable while popups are active.

We required a standardized, state-of-the-art visual pattern and behavioral contract for all high-value popup modals across the platform that:
1. Keeps the workspace context gently visible behind a high-end **frosted glass white blur**.
2. Automatically locks background document scrolling when open.
3. Uses a cohesive, radiant **ColorHunt Blue Palette Design** (`#E3F2FD`, `#90CAF9`, `#2196F3`, `#1E88E5`, `#1565C0`, `#0D47A1`) for the modal shell, header, section cards, inputs, and action buttons.

---

## 2. Decision & Architectural Specifications

We standardize all popup modal dialogs in the application on the **Translucent White Blur & Radiant Blue Modal Design Pattern**.

### Key Rules & Requirements:
1. **Backdrop**: Semi-transparent white (`rgba(255, 255, 255, 0.75)`) infused with soft radial light-blue ambient glows (`rgba(227, 242, 253, 0.75)`, `rgba(144, 202, 249, 0.65)`, `rgba(33, 150, 243, 0.22)`, `rgba(13, 71, 161, 0.08)`) and high-density backdrop blur (`backdropFilter: 'blur(16px)'`, `-webkit-backdrop-filter: 'blur(16px)'`).
2. **Scroll Prevention**: Automatically toggle `document.body.style.overflow = 'hidden'` on open and restore on unmount/close via `useEffect`.
3. **Modal Container Shell**: Ice-blue surface (`#F4F8FC`), glowing blue border (`2px solid #2196F3`), drop shadow (`0 24px 60px rgba(13, 71, 161, 0.25)`), and top accent bar (`linear-gradient(90deg, #E3F2FD ... #0D47A1)`).
4. **Header Banner**: Vibrant ocean-blue gradient (`linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)`) with white title typography, frosted icon container, and crisp white action buttons.

---

## 3. Color & Style Tokens Reference

| Element | CSS Property / Token | Value / Gradient |
| :--- | :--- | :--- |
| **Backdrop Layer** | `background` | `radial-gradient(ellipse at 12% 18%, rgba(227, 242, 253, 0.75) 0%, transparent 50%), radial-gradient(ellipse at 88% 22%, rgba(144, 202, 249, 0.65) 0%, transparent 52%), radial-gradient(ellipse at 50% 50%, rgba(33, 150, 243, 0.22) 0%, transparent 70%), radial-gradient(ellipse at 20% 82%, rgba(13, 71, 161, 0.08) 0%, transparent 50%), rgba(255, 255, 255, 0.75)` |
| **Backdrop Blur** | `backdropFilter` / `-webkit-backdrop-filter` | `blur(16px)` |
| **Modal Container** | `background` | `#F4F8FC` (Ice Blue Surface) |
| **Modal Border** | `border` | `2px solid #2196F3` |
| **Modal Drop Shadow** | `boxShadow` | `0 24px 60px rgba(13, 71, 161, 0.25), 0 0 35px rgba(33, 150, 243, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)` |
| **Top Accent Bar** | `background` | `linear-gradient(90deg, #E3F2FD 0%, #90CAF9 25%, #2196F3 65%, #0D47A1 100%)` |
| **Header Banner** | `background` | `linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)` |
| **Header Title** | `color` / `fontWeight` | `#FFFFFF` / `700` |
| **Header Icon Badge**| `background` / `border` | `rgba(255, 255, 255, 0.2)` / `1px solid rgba(255, 255, 255, 0.35)` |
| **Section Cards** | `background` / `border` | `#FFFFFF` / `1px solid rgba(33, 150, 243, 0.28)` |
| **Section Card Shadow**| `boxShadow` | `0 4px 16px rgba(13, 71, 161, 0.06)` |
| **Section Labels** | `color` / `fontWeight` | `#0D47A1` / `700` |
| **Secondary Buttons** | `background` / `border` / `color` | `rgba(33, 150, 243, 0.08)` / `1px solid rgba(33, 150, 243, 0.3)` / `#1565C0` |
| **Form Inputs** | `background` / `border` / `color` | `#FFFFFF` / `1px solid rgba(33, 150, 243, 0.35)` / `#0F172A` |
| **Primary Action Button**| `background` / `color` / `boxShadow` | `linear-gradient(135deg, #2196F3 0%, #0D47A1 100%)` / `#FFFFFF` / `0 4px 16px rgba(13, 71, 161, 0.4)` |
| **Table Header (`<th>`)**| `background` / `color` | `#F0F7FF` / `#0D47A1` (Border: `2px solid rgba(33, 150, 243, 0.3)`) |
| **Table Row (`<tr>`)** | `background` / `borderBottom` | Alternate `#FFFFFF` / `#FAFCFF` (Border: `1px solid rgba(33, 150, 243, 0.15)`) |

---

## 4. Reusable React Modal Component Template

Developers can copy and adapt this standard React modal pattern to implement the White Blur & Blue Themed Modal anywhere across the codebase:

```tsx
import React, { useEffect, useCallback } from 'react';
import { X, Sparkles, Check } from 'lucide-react';

export interface BlueThemeModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onConfirm?: () => void;
  children: React.ReactNode;
}

export function BlueThemeModal({
  open,
  title,
  subtitle = 'Platform Workflow Popup',
  onClose,
  onConfirm,
  children,
}: BlueThemeModalProps) {
  // 1. Lock document body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // 2. Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    /* ── Backdrop Layer: White Translucent Blur with Ambient Light-Blue Glows ── */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: `
          radial-gradient(ellipse at 12% 18%, rgba(227, 242, 253, 0.75) 0%, transparent 50%),
          radial-gradient(ellipse at 88% 22%, rgba(144, 202, 249, 0.65) 0%, transparent 52%),
          radial-gradient(ellipse at 50% 50%, rgba(33, 150, 243, 0.22) 0%, transparent 70%),
          radial-gradient(ellipse at 20% 82%, rgba(13, 71, 161, 0.08) 0%, transparent 50%),
          rgba(255, 255, 255, 0.75)
        `,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ── Modal Shell: Rich Blue Design ── */}
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          background: '#F4F8FC',
          border: '2px solid #2196F3',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(13, 71, 161, 0.25), 0 0 35px rgba(33, 150, 243, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 48px)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Radiant Accent Line */}
        <div
          style={{
            height: '5px',
            width: '100%',
            background: 'linear-gradient(90deg, #E3F2FD 0%, #90CAF9 25%, #2196F3 65%, #0D47A1 100%)',
          }}
        />

        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)',
            borderBottom: '1px solid rgba(33, 150, 243, 0.3)',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
              }}
            >
              <Sparkles size={18} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                {title}
              </h2>
              <span style={{ fontSize: '11px', color: '#E3F2FD', fontWeight: 500 }}>
                {subtitle}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '8px',
                padding: '6px 8px',
                cursor: 'pointer',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Content Area ── */}
        <div
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 140px)',
          }}
        >
          {children}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '14px 24px',
            background: '#F0F7FF',
            borderTop: '1px solid rgba(33, 150, 243, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(33, 150, 243, 0.08)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#1565C0',
            }}
          >
            Cancel
          </button>

          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              style={{
                background: 'linear-gradient(135deg, #2196F3 0%, #0D47A1 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 18px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(33, 150, 243, 0.4)',
              }}
            >
              <Check size={14} />
              <span>Confirm & Apply</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Consequences & Impact

- **Consistency**: Guarantees visual unity across all workflow modals, buyer roster views, and configuration popovers.
- **Accessibility & Contrast**: Provides high contrast dark blue text (`#0D47A1`, `#0F172A`) against crisp white input cards, improving legibility compared to dark mode popups.
- **Context Awareness**: The frosted white blur backdrop maintains context of the underlying workspace without causing visual distraction.
- **Reusability**: Offers a plug-and-play code template for developers creating future modals in the application.
