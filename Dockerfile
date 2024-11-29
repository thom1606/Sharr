# Use the official Bun image
FROM oven/bun:latest

# Set the working directory
WORKDIR /app

# Install curl
RUN apt-get update && apt-get install -y curl

# Copy package.json and bun.lockb
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 6464

# Command to run the application
CMD ["bun", "run", "server.ts"]

HEALTHCHECK --interval=3h --timeout=10s --start-period=5s --retries=3 \
  CMD ["curl", "-f", "http://localhost:6464/health"] || exit 1
