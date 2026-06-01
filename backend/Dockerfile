# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency definition files
COPY package*.json ./

# Install all dependencies (including devDependencies for typescript compilation)
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy tsconfig and prisma migration schema files
COPY tsconfig.json ./
COPY prisma ./prisma

# Copy source code and email templates
COPY src ./src
COPY email_templates ./email_templates

# Generate Prisma Client and build TypeScript source files
RUN npm run build

# Install only production dependencies to optimize image size
RUN npm prune --omit=dev --legacy-peer-deps

# Stage 2: Production runtime stage
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy production node_modules, build assets, and configurations
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/email_templates ./email_templates

# Ensure an uploads directory exists for file processing
RUN mkdir -p uploads

# Expose backend port
EXPOSE 5000

ENV NODE_ENV=production

# Startup command (Can be overridden by docker-compose)
CMD ["node", "dist/server.js"]
