# Use the official node image
FROM node:14-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Copy environment file
COPY .env .env

# Expose the port the app runs on
EXPOSE 3000

# Command to run the development server
CMD ["npm", "start"]
