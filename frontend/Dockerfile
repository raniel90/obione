FROM node:22-alpine

WORKDIR /app

# Install deps first to leverage layer cache when source changes
COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
