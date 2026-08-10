# 05 — Email Template Stepper Redesign Specifications

## Overview
Redesigns the workflow email builder experience inside `LiquidationAutomationStudio.tsx` (Section 4) into a sleek 3-step progressive accordion stepper with full-width canvas and bottom live impact status bar.

## Key Specifications & Features

### 1. Progressive 3-Step Accordion Stepper
- **Step 1: Choose Email Template**
  - Dropdown selector of registered templates and presets.
  - Quick action: `[ Next: Configure Subject Line → ]`.
- **Step 2: Email Subject Line & Metadata**
  - Subject line input with dynamic token helper indicators.
  - From email and signature selection.
  - Quick action: `[ Next: Preview & Overrides → ]`.
- **Step 3: Dynamic Data Context & Live Device Renderer**
  - Live context summary (matched lots, target buyers).
  - Runtime override inputs.
  - Responsive `LiveDevicePreview` component with Desktop (600px) and Mobile (360px) viewports.

### 2. Header Quick-Nav & Step Status Badges
- Header renders step navigation pills with green `✓ Completed` badges for finished steps.
- Allows clicking previous completed step pills to jump back and edit parameters without losing downstream state.

### 3. Full-Width Studio Canvas & Bottom Live Impact Banner
- Expanded editor layout utilizing available screen width.
- Sticky bottom status bar displaying live campaign metrics: Matched Lots count, Total Cases, Target Buyers count, Estimated Liquidation Revenue.
