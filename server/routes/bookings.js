const express = require('express');
const pool = require('../config/db');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

// МАРШРУТ: бронювання столика 
// (перевірка на подвійне бронювання)
router.post('/', authenticateToken, async (req, res) => {
    try {
        // отримуємо від користувача
        const { user_id, seat_id, seat_label, booking_date, start_time, duration_hours, total_price, extras } = req.body;

        if (!user_id || !seat_id || !booking_date || !start_time || !duration_hours) {
            return res.status(400).json({ error: "Недостатньо даних для бронювання" });
        }

        // перевірка на подвійне бронювання
        // початок існуючої броні < кінець нової броні і Кінець існуючої броні > Початок нової броні
        const overlapQuery = `
            SELECT * FROM bookings 
            WHERE seat_id = $1 
              AND booking_date = $2 
              AND status = 'active'
              AND start_time < ($3::time + $4::int * interval '1 hour')
              AND (start_time + duration_hours * interval '1 hour') > $3::time
        `;

        const overlapResult = await pool.query(overlapQuery, [seat_id, booking_date, start_time, duration_hours]);

        if (overlapResult.rows.length > 0) {
            return res.status(409).json({
                error: "На жаль, цей стіл вже заброньовано на обраний час. Будь ласка, оберіть іншу годину або інше місце."
            });
        }

        const extrasJson = JSON.stringify(extras || []);

        const newBooking = await pool.query(
            `INSERT INTO bookings (user_id, seat_id, seat_label, booking_date, start_time, duration_hours, total_price, extras) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [user_id, seat_id, seat_label, booking_date, start_time, duration_hours, total_price, extrasJson]
        );

        res.status(201).json({ message: "Успішно заброньовано", booking: newBooking.rows[0] });
    } catch (err) {
        console.error("Помилка створення бронювання:", err.message);
        res.status(500).json({ error: "Помилка сервера при створенні бронювання" });
    }
});

// МАРШРУТ: перевірка зайнятості місця на карті
router.get('/occupied', authenticateToken, async (req, res) => {
    try {
        const { date, start_time, duration_hours } = req.query;

        if (!date || !start_time || !duration_hours) {
            return res.json([]);
        }

        const query = `
            SELECT seat_id FROM bookings 
            WHERE booking_date = $1 
              AND status = 'active'
              AND start_time < ($2::time + $3::int * interval '1 hour')
              AND (start_time + duration_hours * interval '1 hour') > $2::time
        `;

        const result = await pool.query(query, [date, start_time, duration_hours]);

        // Повертаємо лише масив ID (наприклад: ["desk-123", "round_table-456"])
        const occupiedSeats = result.rows.map(row => row.seat_id);

        res.json(occupiedSeats);
    } catch (err) {
        console.error("Помилка отримання зайнятих місць:", err.message);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

module.exports = router;