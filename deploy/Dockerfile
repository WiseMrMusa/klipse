FROM node:18-alpine

WORKDIR /deploy-app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Mount NAS input/output directories
VOLUME ["/nas/input", "/nas/deployments"]

CMD ["npm", "start"]