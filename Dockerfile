FROM node:18-alpine

# Устанавливаем зависимости для sharp
RUN apk add --no-cache \
    build-base \
    vips-dev fftw-dev

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 999
CMD ["npm", "start"]