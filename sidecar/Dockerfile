# Use an official, lightweight Python image
FROM python:3.11-slim

WORKDIR /app

# 1. Install necessary system dependencies for building C/C++ extensions and OpenCV/Docling
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Upgrade pip to modern version to avoid wheel build and dependency resolver errors
RUN pip install --no-cache-dir --upgrade pip

# 3. FORCE PYTORCH CPU VERSION FIRST
# This prevents pip from downloading 2GB+ of useless NVIDIA CUDA libraries for Mac M4 / CPU environments
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 4. Copy and install the rest of your requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# 5. Copy the rest of your application code
COPY . .

# Expose the port
EXPOSE 8000

# Run your FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]