const express = require('express');
const pool = require('../config/db');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

// МАРШРУТ: збереження карти
router.post('/', async (req, res) => {
    try {
        const { name, objects } = req.body; // З фронтенду 

        if (!name || !objects) {
            return res.status(400).json({ error: 'Необхідно передати name та objects' });
        }

        // якщо карта з таким іменем вже є — оновлюємо її, 
        // якщо ні — створюємо нову
        const query = `
            INSERT INTO maps (name, object) 
            VALUES ($1, $2) 
            ON CONFLICT (name) 
            DO UPDATE SET object = EXCLUDED.object, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        // Зберігаємо масив фігур як JSON
        const result = await pool.query(query, [name, JSON.stringify(objects)]);

        res.status(200).json({ message: 'Карту успішно збережено', map: result.rows[0] });

    } catch (error) {
        console.error('Помилка збереження карти:', error);
        res.status(500).json({ error: 'Помилка сервера при збереженні' });
    }
});

// МАРШРУТ: список усіх кімнат
router.get('/', async (req, res) => {
    try {
        // Витягуємо лише імена карт
        const result = await pool.query("SELECT name, updated_at FROM maps ORDER BY updated_at DESC");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Помилка отримання списку карт:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

// МАРШРУТ: отримання карти
router.get('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const query = 'SELECT object FROM maps WHERE name = $1';
        const result = await pool.query(query, [name]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Карту не знайдено' });
        }

        res.status(200).json(result.rows[0].object);

    } catch (error) {
        console.error('Помилка отримання карти:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

// МАРШРУТ: видалити кіманту
router.delete('/:name', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name } = req.params;
        await pool.query("DELETE FROM maps WHERE name = $1", [name]);
        res.status(200).json({ message: 'Кімнату успішно видалено' });
    } catch (error) {
        console.error('Помилка видалення карти:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

module.exports = router;