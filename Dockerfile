# Use a lightweight official Node.js image
FROM node:20-slim

# Install Python 3 and pip
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Set python command link
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Set the working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Install python dependencies (using --break-system-packages for system-wide pip in slim image)
RUN pip3 install --no-cache-dir --break-system-packages google-genai

# Copy the rest of the application files
COPY . .

# Set dynamic Cloud Run port environment variable (default to 8080 as standard Cloud Run default)
ENV PORT=8080
EXPOSE 8080

# Run the express server
CMD ["node", "server.js"]
