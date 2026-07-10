FROM node:24-alpine

WORKDIR /app

# Install package files
COPY package*.json ./

# Install all dependencies (including devDependencies like vite)
RUN npm ci

# Copy code files
COPY . .

EXPOSE 5173

# Start Vite server binding to 0.0.0.0 so it is accessible from host machine
CMD ["npm", "run", "dev", "--", "--host"]
