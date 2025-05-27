const express = require('express');
const QRCode = require('qrcode');
const sharp = require('sharp');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));

const TEMPLATE_PATH = path.join(__dirname, 'template.jpg');
const WIDTH = 1080;
const CODE_WIDTH = 700;
const HEIGHT = 1350;

// Генерируем SVG-оверлей с QR и текстом
async function makeOverlaySVG({ qrData, orderNumber, ticketNumber, category }) {
    const qrDataUri = await QRCode.toDataURL(qrData, { margin: 1.5, width: CODE_WIDTH });

    const qrX = WIDTH/2 - CODE_WIDTH/2;
    const qrY = HEIGHT/2 - CODE_WIDTH/2 + 140;
    const lineHeight = 70;

    const centerX = WIDTH / 2;                            // центр по X
    const textY  = HEIGHT - lineHeight * 1.3;             // ваша Y-координата

    return `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <image x="${qrX}" y="${qrY}" width="${CODE_WIDTH}" height="${CODE_WIDTH}" href="${qrDataUri}" />

      <style>
        .label {
          fill: #fff;
          font-family: Helvetica, sans-serif;
          font-weight: bold;
          font-size: 40px;
          text-transform: uppercase;
        }
      </style>

      <text 
        x="${centerX}" 
        y="${textY}" 
        class="label"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${category} #${ticketNumber}
      </text>
    </svg>
  `;
}

app.get('/generate', async (req, res) => {
    try {
        const { qrData, orderNumber, ticketNumber, category } = req.query;
        if (!qrData || !orderNumber || !ticketNumber || !category) {
            return res.status(400).json({ error: 'Не все параметры переданы' });
        }

        // Загружаем шаблон и компонуем с SVG-оверлеем
        const overlaySVG = await makeOverlaySVG({ qrData, orderNumber, ticketNumber, category });
        const ticketBuffer = await sharp(TEMPLATE_PATH)
            .composite([{ input: Buffer.from(overlaySVG), top: 0, left: 0 }])
            .jpeg()
            .toBuffer();

        res.set('Content-Type', 'image/jpeg');
        res.send(ticketBuffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при генерации билета' });
    }
});

const PORT = process.env.PORT || 999;
app.listen(PORT, () => console.log(`Listening on :${PORT}`));