# Hybrid Data Ingestion Pipeline

CPG supplier invoice layouts are highly unstructured and inconsistent. We decided to build a hybrid ingestion engine that runs fuzzy string matching on headers first, optionally normalizes messy product details via a Gemini LLM, and provides a B2B self-serve UI mapper to let users manually configure column layouts. This ensures the service works offline, leverages LLM capabilities when keys are present, and guarantees ingestion accuracy through user confirmation.
