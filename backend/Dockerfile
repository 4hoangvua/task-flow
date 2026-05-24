FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma folder
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build backend
RUN npm run build

# Expose backend port
EXPOSE 5000

# Start server and run migrations on launch
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
