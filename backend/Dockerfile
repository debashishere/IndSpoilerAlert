FROM node:24-alpine AS builder

WORKDIR /app

# Install package files
COPY package*.json ./

# Install dependencies (including devDependencies for TypeScript compiler)
RUN npm ci

# Copy tsconfig and source files
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Run in clean production stage to keep image size small
FROM node:24-alpine AS runner

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled files from builder stage
COPY --from=builder /app/dist ./dist

# Create upload directory in container
RUN mkdir -p uploads

EXPOSE 5001

ENV NODE_ENV=production

CMD ["npm", "start"]
