FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Build the app
RUN npm run build

EXPOSE 3000

# Run production server
CMD ["npm", "start"]