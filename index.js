const express = require('express');
const QRCode = require('qrcode');
const { createCanvas, registerFont, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 999;

// Пути к файлам
const TEMPLATE_PATH = path.join(__dirname, 'ticket.jpg');
const FONT_PATH = path.join(__dirname, 'minecraft-ten-font-cyrillic.ttf');

// Регистрируем шрифт
registerFont(FONT_PATH, { family: 'Minecraft Ten' });

// Размеры QR кода
const QR_SIZE = 550;
const QR_TOP_MARGIN = 427;

// Параметры текста
const TEXT_TOP_MARGIN = 1070;
const TEXT_FONT_SIZE = 26;
const TICKET_ID_FONT_SIZE = 20;
const TEXT_LINE_HEIGHT = 40;

app.get('/generate', async (req, res) => {
    try {
        const { qr, ticket_id, category } = req.query;
        if (!qr || !ticket_id || !category) {
            return res.status(400).json({ error: 'qr, ticket_id и category обязательны' });
        }

        // 1) Загружаем шаблон
        const template = await loadImage(TEMPLATE_PATH);
        const canvas = createCanvas(template.width, template.height);
        const ctx = canvas.getContext('2d');

        // 2) Рисуем шаблон
        ctx.drawImage(template, 0, 0);

        // 3) Генерируем QR код
        const qrDataUrl = await QRCode.toDataURL(qr, {
            width: QR_SIZE,
            margin: 1,
            errorCorrectionLevel: 'H'
        });
        const qrImage = await loadImage(qrDataUrl);
        
        // Рисуем QR код
        ctx.drawImage(
            qrImage,
            (template.width - QR_SIZE) / 2,
            QR_TOP_MARGIN,
            QR_SIZE,
            QR_SIZE
        );

        // 4) Рисуем текст
        // Категория
        ctx.font = `${TEXT_FONT_SIZE}px "Minecraft Ten"`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(category.toUpperCase(), template.width / 2, TEXT_TOP_MARGIN);

        // Номер билета
        ctx.font = `${TICKET_ID_FONT_SIZE}px "Minecraft Ten"`;
        ctx.fillText(ticket_id, template.width / 2, TEXT_TOP_MARGIN + TEXT_LINE_HEIGHT);

        // 5) Отправляем результат
        const buffer = canvas.toBuffer('image/jpeg', { quality: 1 });
        res.set('Content-Type', 'image/jpeg');
        res.set('Content-Disposition', 'inline; filename="temp_ticket.jpg"');
        res.send(buffer);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Что-то пошло не так при генерации' });
    }
});

app.listen(PORT, () => console.log(`Listening on :${PORT}`));