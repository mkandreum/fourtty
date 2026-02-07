FROM node:18-alpine

WORKDIR /app

# Copy package.json and lockfile for deterministic install
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (use ci for production stability)
RUN npm ci

# Copy source code
COPY . .

# Ensure uploads directory exists and is writable by the node user
RUN mkdir -p uploads && chown -R node:node /app

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Switch to non-root user
USER node

# Expose port
EXPOSE 5000

# Start script
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
