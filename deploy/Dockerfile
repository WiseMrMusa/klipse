FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Mount NAS input/output directories
VOLUME ["/nas/input", "/nas/deployments"]

CMD ["npm", "start"]