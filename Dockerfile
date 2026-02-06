# Stage 1: Build Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
# We need to set VITE_API_URL to relative loop for unified deploy or empty to use same host
# Since we proxy /api in production via the same express server, we can use /api relative
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine as backend-build
WORKDIR /app/backend
RUN apk add --no-cache openssl libc6-compat
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
# Generate prisma client
RUN npx prisma generate
RUN npm run build

# Stage 3: Production Runner
FROM node:18-slim
WORKDIR /app

# Install openssl and other dependencies needed by Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install production dependencies for backend
COPY backend/package*.json ./
RUN npm install --production

# Copy prisma schema
COPY --from=backend-build /app/backend/prisma ./prisma

# Generate prisma client in production environment
RUN npx prisma generate

# Copy built backend code
COPY --from=backend-build /app/backend/dist ./dist
# Copy built frontend code to public folder
COPY --from=frontend-build /app/frontend/dist ./public

# Copy uploads folder structure
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start command
CMD ["node", "dist/index.js"]
