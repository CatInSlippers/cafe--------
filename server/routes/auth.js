const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// МАРШРУТ: Реєстрації
router.post('/register', async (req, res) => {
    try {
        // Отримуємо дані від Frontend
        const { full_name, email, password, phone, createdAt, role } = req.body;
        if (!email || !password || !full_name) {
            return res.status(400).json({ error: "Будь ласка, заповніть всі обов'язкові поля!" });
        }
        const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExist.rows.length > 0) {
            return res.status(409).json({ error: "Користувач з таким email вже існує!" });
        }

        // хешування паролю
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            "INSERT INTO users (full_name, email, phone, password_hash, role, created_at) VALUES ($1, $2, $3, $4, 'client', $5) RETURNING *",
            [full_name, email, phone, passwordHash, createdAt]
        );

        res.status(201).json({
            message: "Реєстрація успішна!",
            user: {
                id: newUser.rows[0].user_id,
                name: newUser.rows[0].full_name,
                email: newUser.rows[0].email,
                phone: newUser.rows[0].phone
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// МАРШРУТ: Вхід
router.post('/login', async (req, res) => {
    try {
        // Отримуємо дані від користувача
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Будь ласка, заповніть всі поля!" });
        }

        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Неправильний email" });
        }

        const user = userResult.rows[0];

        // Перевірка на бан
        if (user.banned) {
            const banDate = new Date(user.banned_time).toLocaleString('uk-UA');
            return res.status(403).json({ error: `Ваш акаунт було заблоковано адміністратором (${banDate}). Зверніться до підтримки.` });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: "Неправильний пароль" });
        }

        const token = jwt.sign(
            { user_id: user.user_id, role: user.role },
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({
            token: token,
            user: {
                user_id: user.user_id,
                name: user.full_name,
                role: user.role,
                email: user.email,
                avatar: user.avatar,
                phone: user.phone
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


module.exports = router;