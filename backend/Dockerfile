FROM python:3.9-slim

WORKDIR /app

# Copy and install requirements first (for Docker layer caching)
COPY requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the rest of the code into backend/ subdirectory
COPY . ./backend/

# Create uploads directory inside backend
RUN mkdir -p backend/uploads/evidence

# Set PYTHONPATH so "from backend.xxx" imports work
ENV PYTHONPATH=/app

# Run from /app so "backend.main:app" resolves correctly
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
