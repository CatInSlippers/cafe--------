const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Налаштування з'єднання з БД
const pool = new Pool({
    user: "postgres",
    password: '12345678',
    database: 'cafe',
    host: 'localhost',
    port: 5432,
    max: 100,
});

pool.connect((err) => {
    if (err) {
        console.error('Помилка підключення до БД:', err.message);
    } else {
        console.log("Connected to DB successfully");
    }
});

// ==========================================
// МАРШРУТ РЕЄСТРАЦІЇ (REGISTRATION ROUTE)
// ==========================================
app.post('/register', async (req, res) => {
    try {
        // 1. Отримуємо дані від клієнта (Frontend)
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
                email: newUser.rows[0].email
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// МАРШРУТ ВХОДУ (LOGIN) - Це знадобиться наступним кроком
// ==========================================
app.post('/login', async (req, res) => {
    try {
        // 1. Отримуємо дані від клієнта
        const { email, password } = req.body;

        // Перевірка на наявність даних
        if (!email || !password) {
            return res.status(400).json({ error: "Будь ласка, заповніть всі поля!" });
        }

        // 2. Шукаємо користувача в базі даних
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        // Якщо користувача не знайдено
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Невірний email або пароль" });
        }

        const user = userResult.rows[0];

        // 3. Перевіряємо пароль (порівнюємо введений пароль з хешем у базі)
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: "Невірний email або пароль" });
        }

        // 4. Відправляємо успішну відповідь
        // Frontend очікує: { message, user_id, role, name }
        res.json({
            message: "Вхід успішний!",
            user_id: user.user_id,
            name: user.full_name, // Мапимо full_name з БД на name для фронтенду
            role: user.role,
            email: user.email
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// МАРШРУТ ЗАПИТУ НА ВІДНОВЛЕННЯ (/forgot-password)
// ==========================================
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Перевірка, чи прийшов email
        if (!email) {
            return res.status(400).json({ error: "Введіть email" });
        }

        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Користувача з таким email не знайдено" });
        }

        const user = userResult.rows[0];

        // Створення токена
        const secret = JWT_SECRET + user.password_hash;
        const token = jwt.sign({ id: user.user_id, email: user.email }, secret, { expiresIn: '15m' });

        // Використовуємо 127.0.0.1 замість localhost, іноді це вирішує проблеми мережі на Windows/Mac
        const link = `http://localhost:5173/reset-password/${user.user_id}/${token}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'timeguardtest7@gmail.com',
                pass: process.env.EMAIL_PASS // Краще брати з .env файлу!
            }
        });

        const mailOptions = {
            from: 'TimeGuard Support <timeguardtest7@gmail.com>',
            to: email,
            subject: 'Відновлення пароля TimeGuard',
            html: `
                <h3>Відновлення пароля</h3>
                <p>Ви отримали цей лист, бо надіслали запит на відновлення пароля.</p>
                <p>Натисніть на кнопку нижче, щоб змінити пароль (посилання діє 15 хв):</p>
                <a href="${link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Змінити пароль</a>
                <p>Або перейдіть за посиланням: <br/>${link}</p>
            `
        };

        // Додаємо await, щоб зловити помилку саме тут, якщо вона є
        const info = await transporter.sendMail(mailOptions);

        console.log(`Email надіслано: ${info.response}`);
        console.log(`Посилання (DEBUG): ${link}`);

        res.json({ message: "Посилання на відновлення надіслано на пошту" });

    } catch (error) {
        console.error("ПОМИЛКА SENDMAIL:", error); // Детальний вивід помилки
        res.status(500).json({ error: "Помилка сервера при відправці пошти", details: error.message });
    }
});

// ==========================================
// МАРШРУТ ЗМІНИ ПАРОЛЯ (/reset-password)
// ==========================================
// Цей маршрут викликається, коли користувач вже ввів новий пароль на сторінці
app.post('/reset-password/:id/:token', async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body; // Новий пароль

    try {
        // 1. Знаходимо користувача в БД, щоб отримати його старий хеш пароля для перевірки
        const userResult = await pool.query("SELECT * FROM users WHERE user_id = $1", [id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        const user = userResult.rows[0];

        // 2. Перевіряємо токен
        // Ми використовуємо той самий секрет (JWT_SECRET + старий хеш), щоб розшифрувати токен
        const secret = JWT_SECRET + user.password_hash;

        try {
            const verify = jwt.verify(token, secret);
            // Якщо verify пройшов успішно, токен валідний і час не вийшов
        } catch (err) {
            return res.status(400).json({ error: "Посилання недійсне або застаріло" });
        }

        // 3. Хешуємо НОВИЙ пароль
        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, salt);

        // 4. Оновлюємо пароль у базі даних
        await pool.query(
            "UPDATE users SET password_hash = $1 WHERE user_id = $2",
            [encryptedPassword, id]
        );

        res.json({ message: "Пароль успішно змінено! Тепер ви можете увійти." });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});


// ==========================================
// МАРШРУТИ ДЛЯ КАРТИ (MAPS API)
// ==========================================

// 1. ЗБЕРЕГТИ КАРТУ (Або оновити, якщо існує)
app.post('/api/maps', async (req, res) => {
    try {
        const { name, objects } = req.body;

        if (!name || !objects) {
            return res.status(400).json({ error: "Назва та об'єкти обов'язкові" });
        }

        // Використовуємо UPSERT (Update або Insert)
        // Якщо карта з таким name існує -> оновлюємо objects та час
        // Якщо ні -> створюємо нову
        const query = `
            INSERT INTO maps (name, objects, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (name) 
            DO UPDATE SET 
                objects = EXCLUDED.objects,
                updated_at = NOW()
            RETURNING *;
        `;

        // PostgreSQL автоматично перетворить JS-об'єкт в JSONB завдяки драйверу pg
        const result = await pool.query(query, [name, JSON.stringify(objects)]);

        res.json({
            message: "Карту успішно збережено",
            map: result.rows[0]
        });

    } catch (err) {
        console.error("Помилка збереження карти:", err.message);
        res.status(500).json({ error: "Помилка сервера при збереженні" });
    }
});

// 2. ОТРИМАТИ КАРТУ ЗА НАЗВОЮ
app.get('/api/maps/:name', async (req, res) => {
    try {
        const { name } = req.params;

        const result = await pool.query("SELECT objects FROM maps WHERE name = $1", [name]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Карту не знайдено" });
        }

        // Повертаємо тільки масив об'єктів
        res.json(result.rows[0].objects);

    } catch (err) {
        console.error("Помилка завантаження карти:", err.message);
        res.status(500).json({ error: "Помилка сервера при завантаженні" });
    }
});


// GET USER PROFILE BY ID
app.get('/api/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT user_id, full_name, email, phone, role, balance, created_at FROM users WHERE user_id = $1",
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

app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server is running on port ${PORT}`);
});