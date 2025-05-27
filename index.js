const express = require('express');
const QRCode = require('qrcode');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 999;

// Размер итогового квадратного изображения
const SIZE = 1080;

// Путь к вашему логотипу (png с прозрачным фоном)
const LOGO_PATH = path.join(__dirname, 'logo.png');

app.get('/generate', async (req, res) => {
    try {
        const { qr, ticket_id, category } = req.query;
        if (!qr || !ticket_id || !category) {
            return res.status(400).json({ error: 'qr, ticket_id и category обязательны' });
        }

        // 1) Генерация QR-кода в буфер
        const qrSize = Math.round(SIZE * 0.9);                  // 90% от ширины
        const qrBuffer = await QRCode.toBuffer(qr, {
            width: qrSize,
            margin: 1.4,
            errorCorrectionLevel: 'H'
        });

        // 2) Подготовка логотипа
        const logoRaw = fs.readFileSync(LOGO_PATH);
        const logoSize = Math.round(qrSize * 0.3);            // 25% от размера QR
        const logoBuffer = await sharp(logoRaw)
            .resize(logoSize, logoSize, { fit: 'contain' })
            .toBuffer();

        // 3) Позиции элементов
        const margin = Math.round((SIZE - qrSize) / 2);
        const logoOffset = margin + Math.round((qrSize - logoSize) / 2);

        // 4) SVG-оверлей для текста
        const textY = SIZE - margin / 2;  // чуть выше нижнего края
        const fontSize = Math.round(margin * 0.4); // например, 40px если margin=100
        const textSvg = `
      <svg width="${SIZE}" height="${SIZE}">
        <style>
          .label {
            fill: #fff;
            font-size: ${fontSize}px;
            font-family: sans-serif;
            font-weight: bold;
          }
        </style>
        <text 
          x="${SIZE/2}" 
          y="${textY}" 
          text-anchor="middle" 
          dominant-baseline="middle" 
          class="label"
        >
          ${category.toUpperCase()} №${ticket_id}
        </text>
      </svg>
    `;

        // 5) Собираем картинку
        const finalBuffer = await sharp({
            create: {
                width: SIZE,
                height: SIZE,
                channels: 3,
                background: '#000'
            }
        })
            .composite([
                // QR
                { input: qrBuffer, top: margin, left: margin },
                // Логотип
                { input: logoBuffer, top: logoOffset, left: logoOffset },
                // Текст
                { input: Buffer.from(textSvg), top: 0, left: 0 }
            ])
            .jpeg()
            .toBuffer();

        res.set('Content-Type', 'image/jpeg');
        res.send(finalBuffer);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Что-то пошло не так при генерации' });
    }
});

app.listen(PORT, () => console.log(`Listening on :${PORT}`));