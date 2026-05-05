const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Створюємо папку uploads, якщо її немає
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 2. Налаштовуємо сховище для картинок
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Папка, куди зберігатимуться файли
    },
    filename: function (req, file, cb) {
        // Робимо унікальне ім'я файлу (дата + оригінальне розширення)
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


const app = express();
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
                email: newUser.rows[0].email,
                phone: newUser.rows[0].phone
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
            user_id: user.user_id,
            name: user.full_name,
            role: user.role,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone
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

app.post('/api/maps', async (req, res) => {
    try {
        const { name, objects } = req.body; // З фронтенду приходить масив під назвою objects

        if (!name || !objects) {
            return res.status(400).json({ error: 'Необхідно передати name та objects' });
        }

        // ВИПРАВЛЕНО: Таблиця maps, колонка object. 
        // Використовуємо UPSERT: якщо карта з таким іменем вже є — оновлюємо її, якщо ні — створюємо нову
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

// 2. ОТРИМАТИ КАРТУ
app.get('/api/maps/:name', async (req, res) => {
    try {
        const { name } = req.params;

        // ВИПРАВЛЕНО: Таблиця maps, колонка object
        const query = 'SELECT object FROM maps WHERE name = $1';
        const result = await pool.query(query, [name]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Карту не знайдено' });
        }

        // Бібліотека 'pg' автоматично парсить JSON, тому повертаємо колонку object
        res.status(200).json(result.rows[0].object);

    } catch (error) {
        console.error('Помилка отримання карти:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});


// GET USER PROFILE BY ID
app.get('/api/user/:id', async (req, res) => {
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

// ==========================================
// МАРШРУТ ОНОВЛЕННЯ ПРОФІЛЮ КОРИСТУВАЧА (PUT)
// ==========================================
app.put('/api/user/:id', async (req, res) => {
    const { id } = req.params;
    const { name, phone, currentPassword, newPassword } = req.body;

    try {
        // 1. Знаходимо користувача в БД
        const userResult = await pool.query("SELECT * FROM users WHERE user_id = $1", [id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        const user = userResult.rows[0];

        // 2. Готуємо змінні для SQL запиту (за замовчуванням залишаємо старі дані, якщо нові не прийшли)
        let query = "UPDATE users SET full_name = $1, phone = $2";
        let values = [name || user.full_name, phone || user.phone];
        let valueIndex = 3;

        // 3. Логіка зміни пароля
        if (currentPassword && newPassword) {
            // Перевіряємо, чи збігається введений "поточний пароль" з тим, що в базі
            const validPassword = await bcrypt.compare(currentPassword, user.password_hash);

            if (!validPassword) {
                // Якщо пароль невірний, одразу перериваємо виконання і повертаємо помилку
                return res.status(401).json({ error: "Невірний поточний пароль!" });
            }

            // Якщо все ок — хешуємо новий пароль
            const salt = await bcrypt.genSalt(10);
            const hashedNewPassword = await bcrypt.hash(newPassword, salt);

            // Додаємо оновлення пароля до нашого SQL запиту
            query += `, password_hash = $${valueIndex}`;
            values.push(hashedNewPassword);
            valueIndex++;
        }

        // 4. Завершуємо формування запиту
        query += ` WHERE user_id = $${valueIndex} RETURNING user_id, full_name, email, phone, role`;
        values.push(id);

        // 5. Виконуємо запит до БД
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

// ==========================================
// МАРШРУТ ВИДАЛЕННЯ АКАУНТА (DELETE)
// ==========================================
app.delete('/api/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Видаляємо користувача з бази даних
        const result = await pool.query(
            "DELETE FROM users WHERE user_id = $1 RETURNING *",
            [id]
        );

        // Якщо користувача з таким ID не було в базі
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        res.json({ message: "Акаунт успішно видалено" });

    } catch (err) {
        console.error("Помилка видалення акаунта:", err.message);
        res.status(500).json({ error: "Помилка сервера при видаленні акаунта" });
    }
});

// ==========================================
// МАРШРУТ ЗАВАНТАЖЕННЯ АВАТАРА (POST)
// ==========================================
app.post('/api/user/:id/avatar', upload.single('avatar'), async (req, res) => {
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

// ==========================================
// МАРШРУТИ БРОНЮВАННЯ (BOOKINGS)
// ==========================================

// 1. СТВОРЕННЯ БРОНЮВАННЯ
// 1. СТВОРЕННЯ БРОНЮВАННЯ
app.post('/api/bookings', async (req, res) => {
    try {
        const { user_id, seat_id, seat_label, booking_date, start_time, duration_hours, total_price, extras } = req.body;

        if (!user_id || !seat_id || !booking_date || !start_time || !duration_hours) {
            return res.status(400).json({ error: "Недостатньо даних для бронювання" });
        }

        // --- НОВИЙ БЛОК: Перевірка на перетин часу (Overlap Check) ---
        // Логіка: Початок існуючої броні < Кінець нової броні АНД Кінець існуючої броні > Початок нової броні
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
        // --- КІНЕЦЬ НОВОГО БЛОКУ ---

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

// 2. ОТРИМАННЯ БРОНЮВАНЬ КОРИСТУВАЧА
app.get('/api/user/:id/bookings', async (req, res) => {
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

// ==========================================
// ОТРИМАННЯ ЗАЙНЯТИХ МІСЦЬ ДЛЯ КАРТИ
// ==========================================
app.get('/api/bookings/occupied', async (req, res) => {
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


// ==========================================
// МАРШРУТИ АДМІНІСТРАТОРА (ADMIN API)
// ==========================================

// 1. Отримати список всіх користувачів
// 1. Отримати список всіх користувачів (ОНОВЛЕНО: додано нові колонки)
app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await pool.query(
            // Додали banned та banned_time
            "SELECT user_id, full_name, email, phone, role, balance, created_at, avatar, banned, banned_time FROM users ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Помилка отримання користувачів:", err.message);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

// 2. Видалити користувача (Адмін)
app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
        res.json({ message: "Користувача успішно видалено" });
    } catch (err) {
        console.error("Помилка видалення:", err.message);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

// 3. НОВИЙ МАРШРУТ: Забанити / Розбанити користувача
app.patch('/api/admin/users/:id/ban', async (req, res) => {
    const { id } = req.params;
    const { banned } = req.body; // Отримуємо бажаний статус: true або false

    try {
        let query;
        let values;

        if (banned) {
            // Якщо банимо — встановлюємо banned = true та поточний час
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

app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server is running on port ${PORT}`);
});