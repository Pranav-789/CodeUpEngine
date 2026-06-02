FROM node:20-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Expose Vite's default dev port
EXPOSE 5173

# Start the development server and bind to 0.0.0.0 so it's accessible from the host
CMD ["npm", "run", "dev", "--", "--host"]
