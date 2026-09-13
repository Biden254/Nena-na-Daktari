# Frontend Dockerfile for Nena na Daktari
# Multi-stage build for production

# Stage 1: Build dependencies
FROM node:18-alpine as builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy application code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production image with nginx
FROM nginx:alpine as production

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
