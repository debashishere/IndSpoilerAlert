# 03 — Dynamic Buyer Account Name Tokens & Zero-Buyer Guardrails

## Overview
Defines how buyer-specific dynamic fields (such as `{{buyer_name}}`, `{{buyer_company}}`, `{{buyer_email}}`) interact with the Email Builder in both standalone mode and live workflow execution modes, including zero-buyer safety guardrails.

## Key Specifications & Features

### 1. Standalone Template Editor "Buyer Account Name" Token Chip
- `buyer_name` ("Buyer Account Name") is a standard chip in the token palette.
- Inserting `buyer_name` creates an interactive pill badge (`<span class="dynamic-token-pill" data-token="buyer_name"...>Buyer Account Name ℹ️</span>`).
- In standalone mode, `buyer_name` acts as an unbound dynamic placeholder without requiring pre-selected buyer data.

### 2. Backend Dynamic Compiler & Zero-Buyer Guardrail Audit
- In backend compilation (`email_compiler.ts`):
  - When compiling for a specific target buyer, `{{buyer_name}}` is resolved to `buyer.companyName` or `buyer.name`.
  - *Zero-Buyer Guardrail:* If a campaign stage targets 0 buyers (or empty segment), the dispatch engine prevents sending empty broadcasts and logs an audit error: `"Zero Target Buyers Resolved for Stage Dispatch"`.

### 3. Workflow Stage Template Attachment & Zero-Buyer Restriction UI
- In `LiquidationAutomationStudio.tsx`, if the stage target buyer count is 0:
  - Displays a warning banner: `"⚠️ 0 Buyers Matched in Target Segment. Template dispatches will be disabled until target filters are updated."`
  - Disables stage launch CTA button until at least 1 buyer matches the segment criteria.

### 4. Workflow Stage Live Preview & Recipient Inspection
- In Step 3 of the Workflow Email Builder, a buyer inspection dropdown allows selecting from matched stage buyers to live-preview compiled personalized output (e.g. previewing how `Grocery Outlet` vs `Big Lots` sees the personalized email).
