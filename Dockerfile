# Use an official, lightweight Node image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only package files first (see explanation below)
COPY package*.json ./

# Install dependencies (production only — no nodemon etc.)
RUN npm ci --omit=dev

# Now copy the rest of the app
COPY . .

# Document which port the app listens on
EXPOSE 3000

# Command to run when the container starts
CMD ["node", "server.js"]