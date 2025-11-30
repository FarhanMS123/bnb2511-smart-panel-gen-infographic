# Use Node.js 20 as the base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Expose port 3000
EXPOSE 3000

# Set host to 0.0.0.0 to allow external access
ENV HOST=0.0.0.0
ENV PORT=3000

# Run development server
CMD ["pnpm", "dev"]
