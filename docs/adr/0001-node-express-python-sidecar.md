# Use Node.js Express with Python sidecar FastAPI service

The project requires table parsing (via Docling) and ML scoring (pricing, matching). Spawning Python scripts as child processes introduces 5-15 seconds of startup latency due to heavy imports like Torch. We decided to run a Python FastAPI sidecar service alongside our Node.js Express backend, ensuring the AI/ML dependencies are loaded once at startup for low-latency responses.
