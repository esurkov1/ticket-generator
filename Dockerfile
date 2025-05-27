# ticket-generator/Dockerfile
FROM node:18-alpine

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем только package-файлы и ставим зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем весь код и выставляем порт
COPY . .
EXPOSE 999

# Точка входа
CMD ["npm", "start"]