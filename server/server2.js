const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

// Підключення маршрутів
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const bookingRoutes = require('./routes/bookings');
const mapRoutes = require('./routes/maps');

const app = express();
const PORT = process.env.PORT;

// Створення папки uploads, якщо її немає
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ПІДКЛЮЧЕННЯ РОУТЕРІВ 
app.use('/api/auth', authRoutes);       // Всі запити до /api/auth/...
app.use('/api/user', userRoutes);       // Всі запити до /api/user/...
app.use('/api/admin', adminRoutes);     // Всі запити до /api/admin/...
app.use('/api/bookings', bookingRoutes);// Всі запити до /api/bookings/...
app.use('/api/maps', mapRoutes);        // Всі запити до /api/maps/...

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});