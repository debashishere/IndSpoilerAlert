# Streamline Pipeline Tabs and Contextual Manual Record Creation

## Context
The Ingestion subtab navigation bar previously suffixed each dataset tab with "Pipeline" (`Inventory Pipeline`, `Sales Pipeline`, `Buyer Pipeline`) and only provided an action utility for buyers (`+ Add Buyer`). Operators frequently need to register single incoming surplus inventory lots or immediate off-platform sales transactions without executing full batch CSV/Excel parsing pipelines.

## Decision
We remove the redundant "Pipeline" postfix across tab labels, renaming them to clean dataset nouns: `Inventory`, `Sales`, and `Buyers`. Furthermore, we standardize the buyer creation trigger to `Create Buyer` and introduce contextual `Create Inventory` and `Create Sales` action buttons within their respective tab action clusters in `PipelineSwitcherBar`, each backed by a dedicated custom modal form for direct manual record entry.

## Consequences
- Unifies operational ergonomics across all three datasets with symmetric "Create [Entity]" action triggers.
- Provides immediate manual entry paths without forcing operators into multi-step file ingestion flows.
- Maintains strict contextual isolation so actions appear only within their respective dataset workbench.
