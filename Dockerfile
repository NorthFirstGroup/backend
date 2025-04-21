FROM node:20-alpine3.19
ENV NODE_ENV=production

WORKDIR /app
COPY dist/ .
COPY package.json package-lock.json ./

RUN npm ci --production

CMD ["node", "./server.js"]