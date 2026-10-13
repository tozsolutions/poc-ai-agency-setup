FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --no-fund --no-audit
COPY index.js ./index.js
EXPOSE 4010
CMD ["npm", "start"]
