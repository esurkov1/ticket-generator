# ticket-generator/Dockerfile

# 1) Базируемся на Debian-сборке, где проще ставить все нужные пакеты
FROM node:18-bullseye-slim

# 2) Устанавливаем системные зависимости для рендеринга изображений/шрифтов
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      fontconfig \
      libfontconfig1 \
      libcairo2 \
      libpango1.0-0 \
      libjpeg-dev \
      libgif-dev \
      librsvg2-bin \
      libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# 3) Копируем описания зависимостей и ставим только production-зависимости
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 4) Копируем весь код и пробрасываем порт
COPY . .
EXPOSE 999

# 5) Запускаем приложение
CMD ["node", "index.js"]