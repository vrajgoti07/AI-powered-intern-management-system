# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definition files
COPY package*.json ./

# Install packages
RUN npm install --legacy-peer-deps

# Copy configuration and source files
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY eslint.config.js ./
COPY index.html ./
COPY public ./public
COPY src ./src

# Accept build-time environment arguments (with defaults for local dev)
ARG VITE_API_URL=http://localhost:5000/api/v1
ARG VITE_AI_URL=http://localhost:8000

# Set build-time env variables
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AI_URL=$VITE_AI_URL

# Build the static site
RUN npm run build

# Stage 2: Serving stage
FROM nginx:alpine

# Copy built site files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
