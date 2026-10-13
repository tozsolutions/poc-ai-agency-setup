FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --no-fund --no-audit
COPY src ./src
COPY render.mjs ./render.mjs
EXPOSE 3000
CMD ["npm", "run", "render"]
