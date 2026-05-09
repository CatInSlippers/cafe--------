const express = require('express');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
const pool = require('../config/db');
const router = express.Router();

// МАРШРУТ: отримати список користувачів
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT user_id, full_name, email, phone, role, balance, created_at, avatar, banned, banned_time FROM users ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Помилка отримання користувачів:", err.message);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

// МАРШРУТ: видалити користувача
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
        res.json({ message: "Користувача успішно видалено" });
    } catch (err) {
        console.error("Помилка видалення:", err.message);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

// МАРШРУТ: бан/ зняття бану
router.patch('/users/:id/ban', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { banned } = req.body; // Отримуємо статус: true або false

    try {
        let query;
        let values;

        if (banned) {
            // Якщо банимо — встановлюємо banned = true та час
            query = "UPDATE users SET banned = true, banned_time = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *";
            values = [id];
        } else {
            // Якщо розбанюємо — встановлюємо banned = false та обнуляємо час
            query = "UPDATE users SET banned = false, banned_time = NULL WHERE user_id = $1 RETURNING *";
            values = [id];
        }

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        res.json({ message: banned ? "Користувача забанено" : "Користувача розбанено", user: result.rows[0] });

    } catch (err) {
        console.error("Помилка зміни статусу бану:", err.message);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

// МАРШРУТ: статистику конкретного користувача
router.get('/users/:id/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const statsQuery = `
            SELECT 
                COUNT(*) as total_bookings,
                COUNT(*) FILTER (WHERE status = 'active') as active_bookings,
                COALESCE(SUM(total_price), 0) as total_spent
            FROM bookings
            WHERE user_id = $1
        `;
        const result = await pool.query(statsQuery, [id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Помилка отримання статистики користувача:", err.message);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

// МАРШРУТ: оновити дані користувача
router.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, role } = req.body;

        const result = await pool.query(
            "UPDATE users SET full_name = $1, phone = $2, role = $3 WHERE user_id = $4 RETURNING *",
            [full_name, phone, role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        res.json({ message: "Дані користувача оновлено", user: result.rows[0] });
    } catch (err) {
        console.error("Помилка оновлення користувача:", err.message);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

// МАРШРУТ: статистика
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { startDate, endDate, seatId } = req.query;

        // Базові параметри для запиту
        let values = [startDate, endDate];
        let seatFilter = seatId ? `AND seat_id = $3` : '';
        if (seatId) values.push(seatId);

        // запит для загальних підсумків
        const summaryQuery = `
            SELECT 
                COUNT(booking_id) as total_bookings,
                COALESCE(SUM(total_price), 0) as total_revenue,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_bookings,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
            FROM bookings
            WHERE booking_date >= $1 AND booking_date <= $2 ${seatFilter}
        `;
        const summaryResult = await pool.query(summaryQuery, values);

        // запит для по днях
        const dailyQuery = `
            SELECT 
                TO_CHAR(booking_date, 'YYYY-MM-DD') as date,
                COUNT(booking_id) as daily_bookings,
                COALESCE(SUM(total_price), 0) as daily_revenue
            FROM bookings
            WHERE booking_date >= $1 AND booking_date <= $2 ${seatFilter}
            GROUP BY booking_date
            ORDER BY booking_date ASC
        `;
        const dailyResult = await pool.query(dailyQuery, values);

        res.json({
            summary: summaryResult.rows[0],
            daily: dailyResult.rows
        });
    } catch (err) {
        console.error("Помилка отримання статистики:", err.message);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

// МАРШРУТ: отримання всіх бронювань з гнучкою фільтрацією
router.get('/bookings', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Додали параметр timeframe
        const { date, status, timeframe } = req.query;

        let query = `
            SELECT b.*, u.full_name, u.email, u.phone 
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.user_id
            WHERE 1=1
        `;
        const values = [];
        let valueIndex = 1;

        // Логіка періоду
        if (timeframe === 'past') {
            query += ` AND b.booking_date < CURRENT_DATE`;
        } else if (timeframe === 'upcoming') {
            query += ` AND b.booking_date >= CURRENT_DATE`;
        } else if (timeframe === 'specific' && date) {
            query += ` AND b.booking_date = $${valueIndex}`;
            values.push(date);
            valueIndex++;
        }
        // Якщо timeframe === 'all', ми просто не додаємо умов по даті

        if (status && status !== 'all') {
            query += ` AND b.status = $${valueIndex}`;
            values.push(status);
            valueIndex++;
        }

        query += ` ORDER BY b.booking_date DESC, b.start_time DESC`;

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error("Помилка отримання бронювань:", err.message);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

// МАРШРУТ: скасування бронювання 
router.patch('/bookings/:id/cancel', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "UPDATE bookings SET status = 'cancelled' WHERE booking_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Бронювання не знайдено" });
        }

        res.json({ message: "Бронювання скасовано", booking: result.rows[0] });
    } catch (err) {
        console.error("Помилка скасування бронювання:", err.message);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

module.exports = router;