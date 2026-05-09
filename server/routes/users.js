const express = require('express');
const bcrypt = require('bcrypt');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
const pool = require('../config/db');
const upload = require('../middlewares/uploadMiddleware');
const router = express.Router();

// МАРШРУТ: пошук користувача за id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT user_id, full_name, email, phone, role, balance, created_at, avatar FROM users WHERE user_id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// МАРШРУТ: оновлення даних користувача (ім'я, телефон, пароль)
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, phone, currentPassword, newPassword } = req.body;

    try {
        const userResult = await pool.query("SELECT * FROM users WHERE user_id = $1", [id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        const user = userResult.rows[0];

        // за замовчуванням залишаємо старі дані, якщо нові не прийшли
        let query = "UPDATE users SET full_name = $1, phone = $2";
        let values = [name || user.full_name, phone || user.phone];
        let valueIndex = 3;

        // зміни пароля
        if (currentPassword && newPassword) {
            // Перевіряємо, чи збігається введений "поточний пароль" з тим, що в базі
            const validPassword = await bcrypt.compare(currentPassword, user.password_hash);

            if (!validPassword) {
                return res.status(401).json({ error: "Невірний поточний пароль!" });
            }

            // хешуємо новий пароль
            const salt = await bcrypt.genSalt(10);
            const hashedNewPassword = await bcrypt.hash(newPassword, salt);

            // оновлення пароля до SQL запиту
            query += `, password_hash = $${valueIndex}`;
            values.push(hashedNewPassword);
            valueIndex++;
        }

        // формування запиту
        query += ` WHERE user_id = $${valueIndex} RETURNING user_id, full_name, email, phone, role`;
        values.push(id);

        // Виконуємо запит
        const updatedUser = await pool.query(query, values);

        res.json({
            message: "Профіль успішно оновлено!",
            user: {
                id: updatedUser.rows[0].user_id,
                name: updatedUser.rows[0].full_name,
                email: updatedUser.rows[0].email,
                phone: updatedUser.rows[0].phone,
                role: updatedUser.rows[0].role
            }
        });

    } catch (err) {
        console.error("Помилка оновлення профілю:", err.message);
        res.status(500).json({ error: "Помилка сервера при оновленні" });
    }
});

// МАРШРУТ: видалення користувача
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            "DELETE FROM users WHERE user_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }
        res.json({ message: "Акаунт успішно видалено" });

    } catch (err) {
        console.error("Помилка видалення акаунта:", err.message);
        res.status(500).json({ error: "Помилка сервера при видаленні акаунта" });
    }
});

// МАРШРУТ: додавання аватарки
router.post('/:id/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    const { id } = req.params;

    try {
        if (!req.file) {
            return res.status(400).json({ error: "Файл не завантажено" });
        }

        // Формуємо шлях до файлу (наприклад: /uploads/1678901234.jpg)
        const avatarUrl = `/uploads/${req.file.filename}`;

        // Оновлюємо посилання в базі даних
        const result = await pool.query(
            "UPDATE users SET avatar = $1 WHERE user_id = $2 RETURNING avatar",
            [avatarUrl, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        res.json({
            message: "Аватар успішно оновлено!",
            avatarUrl: avatarUrl
        });

    } catch (err) {
        console.error("Помилка завантаження аватара:", err.message);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

// МАРШРУТ: перегляд бронювань користувача
router.get('/:id/bookings', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const bookings = await pool.query(
            "SELECT * FROM bookings WHERE user_id = $1 ORDER BY booking_date DESC, created_at DESC",
            [id]
        );
        res.json(bookings.rows);
    } catch (err) {
        console.error("Помилка отримання бронювань:", err.message);
        res.status(500).json({ error: "Помилка сервера при отриманні бронювань" });
    }
});

module.exports = router;