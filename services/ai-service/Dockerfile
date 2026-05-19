FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY services ./services

RUN npm install --workspaces --include-workspace-root=false

WORKDIR /app/services/ai-service

EXPOSE 4003

CMD ["node", "src/server.js"]
