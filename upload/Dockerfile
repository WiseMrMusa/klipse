# Build stage
FROM node:18 AS builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY src ./src
RUN npm run build

# Production stage
FROM node:18-alpine

# Install Git and dependencies
RUN apk add --no-cache git openssh-client

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]