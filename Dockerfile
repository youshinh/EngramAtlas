# Use a lightweight official Node.js image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Set dynamic Cloud Run port environment variable (default to 8080 as standard Cloud Run default)
ENV PORT=8080
EXPOSE 8080

# Run the express server
CMD ["node", "server.js"]
