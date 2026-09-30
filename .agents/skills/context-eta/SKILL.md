---
name: context-eta
description: Audit and estimate LLM context window requirements, token budget, and active working sets for a ticket, issue, or spec. Detects the active chat model, predicts context headroom, and assesses compaction risk. Use when estimating context window, token ETA, or when invoked via /context-eta.
---

# Context Window & Token Budget Estimator (`context-eta`)

Calculate the token **footprint**, peak **working-set**, cumulative **trajectory**, and active model **headroom** to implement a ticket or specification.

---

## Output Rule (Strict)

When invoked, the output must **ONLY** contain the Total Estimated Context Window Size and the breakdown table formatted exactly as specified in Step 5. Do not include conversational preambles, introductory filler, or concluding remarks.

---

## Process

### 1. Scope the Ticket

Read the specified ticket, issue, or specification file completely.

- Extract the target seam: touched services, endpoints, data models, and migration layers.
- Identify the required test surfaces: unit tests, integration tests, or mock fixtures.
- Identify relevant domain documentation: `CONTEXT.md` sections and historical ADRs in `docs/adr/`.
- Estimate the slice count: count vertical slices or acceptance criteria to size the execution loop.

*Completion criterion:* An inventory of touched modules, models, tests, slices, and domain docs is compiled.

### 2. Gauge the File Footprint

Measure the physical size of every identified file using shell utilities:

```bash
wc -c <path_to_ticket> <source_files...> <test_files...> <adr_files...> CONTEXT.md
```

Apply the token ratio: **1 token ≈ 4 characters** for English text, Markdown, and code.

*Completion criterion:* Exact byte counts and calculated token counts for all scoped files are recorded.

### 3. Determine the Workflow Multiplier & Active Model

1. Identify the workflow required or requested:
   - **Direct Implementation (`/implement`):** 1.8× – 2.2×
   - **Test-Driven Development (`/tdd` - Red-Green Cycles):** 2.2× – 2.8× (high test-run & patch-diff iteration)
   - **Refactor / Deepening (`/improve-codebase-architecture`):** 2.8× – 3.8×
   - **Interface Exploration (`/design-an-interface`):** 2.2× – 2.8×
   - **Bug Investigation (`/diagnosing-bugs`):** 2.5× – 3.5×
2. Identify the active model powering the chat (e.g. Gemini 3.8/2.0/1.5 Flash/Pro with 1M ceiling, Claude 3.5/3.7 Sonnet with 200k ceiling, GPT-4o with 128k ceiling) and determine headroom and compaction risk.

*Completion criterion:* The workflow multiplier, active model name, context ceiling, and headroom are determined.

### 4. Compute the Token Ledger

Compute realistic tokens for each category, calibrated against empirical agent session telemetry:

- **System, Environment & Injected Skills:**
  - Base agent environment (system persona, 15–20 native tool JSON schemas, lazy MCP tool declarations, skills directory registry): **~28,000 – 35,000 tokens** baseline.
  - Injected skill markdown (e.g. `/tdd`, `/context-eta`, `/grill-me` when triggered via slash command): **+1,500 – 3,500 tokens** per active skill.
- **Domain Model & History:**
  - `CONTEXT.md` (~11k tokens for ~45 KB), relevant ADRs (~1k – 4k tokens), and git history / search matches (~2k – 4k tokens).
- **Core Source Code:**
  - Files to modify, inspect, or reference (`wc -c ÷ 4`), plus AST search matches and partial view chunks.
- **Test Suites & Target Spec:**
  - Target ticket specification markdown, existing test suites, mock fixtures, and seed scripts.
- **Interactive Dialogue & Model Reasoning:**
  - Turn dialogue, plan proposals, user confirmations, and model internal chain-of-thought / thinking tokens (**~4,000 – 8,000 tokens**).
- **Implementation, Tool Diffs & Test Runs:**
  - Tool call payloads (`replace_file_content` / `write_to_file` carry target + replacement code) and tool diff responses: **~1,500 – 2,500 tokens per patch**.
  - Test runner executions (Jest/Pytest stdout, coverage tables, timeout logs, background task notifications, compiler checks): **~1,500 – 2,500 tokens per test run**.
  - Formula for TDD / multi-slice tickets:
    $$\text{Tokens}_{\text{runs}} \approx (N_{\text{slices}} \times 2.5 \text{ runs} \times 1,800) + (N_{\text{slices}} \times 2 \text{ patches} \times 2,000)$$

*Completion criterion:* Token numbers for all six categories and the calibrated cumulative total are calculated.

### 5. Render the Strict Output

Output **ONLY** the following markdown structure:

```markdown
# Total Estimated Context Window Size: ~[Min] – [Max] Tokens

### 1. Context Breakdown by Component

| Component | Files / Scope | Approximate Tokens |
| :--- | :--- | :--- |
| **System, Environment & Injected Skills** | Base agent environment, 15–20 tool JSON schemas, MCP tools, skills catalog (~28k–35k) + injected active skill markdown | ~[Min] – [Max] |
| **Domain Model & History** | CONTEXT.md ([Size] KB) + relevant ADRs ([ADR list]) + git hot spots | ~[Min] – [Max] |
| **Core Source Code** | [Primary files, line counts, sizes] + related models/controllers | ~[Min] – [Max] |
| **Test Suites & Target Spec** | [Test files, line counts, sizes] + [Ticket filename] spec markdown | ~[Min] – [Max] |
| **Interactive Dialogue & Reasoning** | Turn dialogue, user confirmations, and internal chain-of-thought reasoning | ~[Min] – [Max] |
| **Implementation, Tool Diffs & Test Runs** | Tool patch payloads, diff chunks, test runner logs ([N] slices × runs/patches), compiler feedback | ~[Min] – [Max] |

---

### 2. Active Model Prediction: [Active Model Name]

- **Model Context Ceiling:** [Ceiling, e.g. 1,000,000] tokens
- **Peak Working Set (Single Turn):** ~[Tokens] tokens ([X]% of window)
- **Cumulative Trajectory (Full Session):** ~[Tokens] tokens ([Y]% of window)
- **Remaining Headroom:** ~[Tokens] tokens
- **Status:** [🟢 Optimal | 🟡 Viable with Caution | 🟠 Compaction Risk | 🔴 Exceeds Ceiling]
```

*Completion criterion:* The output is delivered matching the exact layout without any extra conversational text.
