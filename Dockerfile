FROM node:20

# Install system dependencies required by Apibara installer
RUN apt-get update && apt-get install -y \
    curl \
    bash \
    jq \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Install Apibara CLI
RUN curl -sL https://install.apibara.com | bash

# Add Apibara to PATH
ENV PATH="/root/.local/bin:${PATH}"

# Verify Apibara installation
RUN apibara --version

# Copy the rest of the application code
COPY . .

# Prepare the Apibara project
RUN apibara prepare

# Build the TypeScript project
RUN apibara build

# Create a non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs apibara

# Change ownership of app directory
RUN chown -R apibara:nodejs /app

# Switch to non-root user
USER apibara

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD apibara --version || exit 1

# Start the indexer
CMD ["apibara", "start"] 