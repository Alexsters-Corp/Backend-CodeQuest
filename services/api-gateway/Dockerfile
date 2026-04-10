FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY services ./services

RUN npm install --workspaces --include-workspace-root=false

WORKDIR /app/services/api-gateway

EXPOSE 4000

CMD ["node", "src/server.js"]
