// const express = require('express');
// const cors = require('cors');
// const { Pool } = require('pg');
// const bcrypt = require('bcrypt');
// const nodemailer = require('nodemailer');
// const jwt = require('jsonwebtoken');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // 1. Створюємо папку uploads, якщо її немає
// const uploadDir = 'uploads';
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir);
// }

// // 2. Налаштовуємо сховище для картинок
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/'); // Папка, куди зберігатимуться файли
//     },
//     filename: function (req, file, cb) {
//         // Робимо унікальне ім'я файлу (дата + оригінальне розширення)
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });
// exports.storage = storage;

// const upload = multer({ storage: storage });
// exports.upload = upload;

// const app = express();
// exports.app = app;
// const PORT = process.env.PORT || 3005;
// const JWT_SECRET = process.env.JWT_SECRET;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static('uploads'));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Налаштування з'єднання з БД
// const pool = new Pool({
//     user: "postgres",
//     password: '12345678',
//     database: 'cafe',
//     host: 'localhost',
//     port: 5432,
//     max: 100,
// });
// exports.pool = pool;

// pool.connect((err) => {
//     if (err) {
//         console.error('Помилка підключення до БД:', err.message);
//     } else {
//         console.log("Connected to DB successfully");
//     }
// });

// // ==========================================
// // MIDDLEWARES ДЛЯ ЗАХИСТУ API
// // ==========================================

// // 1. Перевірка, чи є користувач авторизованим
// const authenticateToken = (req, res, next) => {
//     // Токен зазвичай передається в заголовку Authorization: Bearer <token>
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];

//     if (!token) {
//         return res.status(401).json({ error: "Немає доступу. Будь ласка, увійдіть в акаунт." });
//     }

//     jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
//         if (err) {
//             return res.status(403).json({ error: "Ваша сесія закінчилася. Увійдіть знову." });
//         }
//         // Записуємо розшифровані дані (user_id, role) в об'єкт запиту
//         req.user = decodedUser;
//         next(); // Пропускаємо далі до маршруту
//     });
// };
// exports.authenticateToken = authenticateToken;

// // 2. Перевірка, чи є користувач Адміністратором
// const isAdmin = (req, res, next) => {
//     if (req.user.role !== 'admin') {
//         return res.status(403).json({ error: "Доступ заборонено. Тільки для адміністраторів." });
//     }
//     next();
// };

// // ==========================================
// // МАРШРУТ РЕЄСТРАЦІЇ (REGISTRATION ROUTE)
// // ==========================================
// app.post('/register', async (req, res) => {
//     try {
//         // 1. Отримуємо дані від клієнта (Frontend)
//         const { full_name, email, password, phone, createdAt, role } = req.body;
//         if (!email || !password || !full_name) {
//             return res.status(400).json({ error: "Будь ласка, заповніть всі обов'язкові поля!" });
//         }
//         const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
//         if (userExist.rows.length > 0) {
//             return res.status(409).json({ error: "Користувач з таким email вже існує!" });
//         }

//         // хешування паролю
//         const salt = await bcrypt.genSalt(10);
//         const passwordHash = await bcrypt.hash(password, salt);


//         const newUser = await pool.query(
//             "INSERT INTO users (full_name, email, phone, password_hash, role, created_at) VALUES ($1, $2, $3, $4, 'client', $5) RETURNING *",
//             [full_name, email, phone, passwordHash, createdAt]
//         );

//         res.status(201).json({
//             message: "Реєстрація успішна!",
//             user: {
//                 id: newUser.rows[0].user_id,
//                 name: newUser.rows[0].full_name,
//                 email: newUser.rows[0].email,
//                 phone: newUser.rows[0].phone
//             }
//         });

//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send("Server Error");
//     }
// });

// // ==========================================
// // МАРШРУТ ВХОДУ (LOGIN)
// // ==========================================
// app.post('/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             return res.status(400).json({ error: "Будь ласка, заповніть всі поля!" });
//         }

//         const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

//         if (userResult.rows.length === 0) {
//             return res.status(401).json({ error: "Невірний email або пароль" });
//         }

//         const user = userResult.rows[0];

//         if (user.banned) {
//             const banDate = new Date(user.banned_time).toLocaleString('uk-UA');
//             return res.status(403).json({ error: `Ваш акаунт було заблоковано адміністратором (${banDate}). Зверніться до підтримки.` });
//         }

//         const validPassword = await bcrypt.compare(password, user.password_hash);

//         if (!validPassword) {
//             return res.status(401).json({ error: "Невірний email або пароль" });
//         }

//         const token = jwt.sign(
//             { user_id: user.user_id, role: user.role },
//             JWT_SECRET, // (цей секрет у тебе вже є на початку файлу)
//             { expiresIn: '24h' }
//         );

//         res.json({
//             token: token,
//             user: {
//                 user_id: user.user_id,
//                 name: user.full_name,
//                 role: user.role,
//                 email: user.email,
//                 avatar: user.avatar,
//                 phone: user.phone
//             }
//         });

//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send("Server Error");
//     }
// });


// // ==========================================
// // МАРШРУТИ ДЛЯ КАРТИ (MAPS API)
// // ==========================================

// app.post('/api/maps', async (req, res) => {
//     try {
//         const { name, objects } = req.body; // З фронтенду приходить масив під назвою objects

//         if (!name || !objects) {
//             return res.status(400).json({ error: 'Необхідно передати name та objects' });
//         }

//         // ВИПРАВЛЕНО: Таблиця maps, колонка object. 
//         // Використовуємо UPSERT: якщо карта з таким іменем вже є — оновлюємо її, якщо ні — створюємо нову
//         const query = `
//             INSERT INTO maps (name, object) 
//             VALUES ($1, $2) 
//             ON CONFLICT (name) 
//             DO UPDATE SET object = EXCLUDED.object, updated_at = CURRENT_TIMESTAMP
//             RETURNING *;
//         `;

//         // Зберігаємо масив фігур як JSON
//         const result = await pool.query(query, [name, JSON.stringify(objects)]);

//         res.status(200).json({ message: 'Карту успішно збережено', map: result.rows[0] });

//     } catch (error) {
//         console.error('Помилка збереження карти:', error);
//         res.status(500).json({ error: 'Помилка сервера при збереженні' });
//     }
// });

// // 2. ОТРИМАТИ КАРТУ
// app.get('/api/maps/:name', async (req, res) => {
//     try {
//         const { name } = req.params;

//         // ВИПРАВЛЕНО: Таблиця maps, колонка object
//         const query = 'SELECT object FROM maps WHERE name = $1';
//         const result = await pool.query(query, [name]);

//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: 'Карту не знайдено' });
//         }

//         // Бібліотека 'pg' автоматично парсить JSON, тому повертаємо колонку object
//         res.status(200).json(result.rows[0].object);

//     } catch (error) {
//         console.error('Помилка отримання карти:', error);
//         res.status(500).json({ error: 'Помилка сервера' });
//     }
// });

// // 3. ОТРИМАТИ СПИСОК УСІХ КІМНАТ (КАРТ)
// app.get('/api/maps', async (req, res) => {
//     try {
//         // Витягуємо лише імена карт (без важкого JSON-об'єкта з фігурами)
//         const result = await pool.query("SELECT name, updated_at FROM maps ORDER BY updated_at DESC");
//         res.status(200).json(result.rows);
//     } catch (error) {
//         console.error('Помилка отримання списку карт:', error);
//         res.status(500).json({ error: 'Помилка сервера' });
//     }
// });

// // 4. ВИДАЛИТИ КІМНАТУ
// app.delete('/api/maps/:name', async (req, res) => {
//     try {
//         const { name } = req.params;
//         await pool.query("DELETE FROM maps WHERE name = $1", [name]);
//         res.status(200).json({ message: 'Кімнату успішно видалено' });
//     } catch (error) {
//         console.error('Помилка видалення карти:', error);
//         res.status(500).json({ error: 'Помилка сервера' });
//     }
// });

// // GET USER PROFILE BY ID
// app.get('/api/user/:id', authenticateToken, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const result = await pool.query(
//             "SELECT user_id, full_name, email, phone, role, balance, created_at, avatar FROM users WHERE user_id = $1",
//             [id]
//         );

//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: "Користувача не знайдено" });
//         }

//         res.json(result.rows[0]);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send("Server Error");
//     }
// });

// // ==========================================
// // МАРШРУТ ОНОВЛЕННЯ ПРОФІЛЮ КОРИСТУВАЧА (PUT)
// // ==========================================
// app.put('/api/user/:id', authenticateToken, async (req, res) => {
//     const { id } = req.params;
//     const { name, phone, currentPassword, newPassword } = req.body;

//     try {
//         // 1. Знаходимо користувача в БД
//         const userResult = await pool.query("SELECT * FROM users WHERE user_id = $1", [id]);

//         if (userResult.rows.length === 0) {
//             return res.status(404).json({ error: "Користувача не знайдено" });
//         }

//         const user = userResult.rows[0];

//         // 2. Готуємо змінні для SQL запиту (за замовчуванням залишаємо старі дані, якщо нові не прийшли)
//         let query = "UPDATE users SET full_name = $1, phone = $2";
//         let values = [name || user.full_name, phone || user.phone];
//         let valueIndex = 3;

//         // 3. Логіка зміни пароля
//         if (currentPassword && newPassword) {
//             // Перевіряємо, чи збігається введений "поточний пароль" з тим, що в базі
//             const validPassword = await bcrypt.compare(currentPassword, user.password_hash);

//             if (!validPassword) {
//                 // Якщо пароль невірний, одразу перериваємо виконання і повертаємо помилку
//                 return res.status(401).json({ error: "Невірний поточний пароль!" });
//             }

//             // Якщо все ок — хешуємо новий пароль
//             const salt = await bcrypt.genSalt(10);
//             const hashedNewPassword = await bcrypt.hash(newPassword, salt);

//             // Додаємо оновлення пароля до нашого SQL запиту
//             query += `, password_hash = $${valueIndex}`;
//             values.push(hashedNewPassword);
//             valueIndex++;
//         }

//         // 4. Завершуємо формування запиту
//         query += ` WHERE user_id = $${valueIndex} RETURNING user_id, full_name, email, phone, role`;
//         values.push(id);

//         // 5. Виконуємо запит до БД
//         const updatedUser = await pool.query(query, values);

//         res.json({
//             message: "Профіль успішно оновлено!",
//             user: {
//                 id: updatedUser.rows[0].user_id,
//                 name: updatedUser.rows[0].full_name,
//                 email: updatedUser.rows[0].email,
//                 phone: updatedUser.rows[0].phone,
//                 role: updatedUser.rows[0].role
//             }
//         });

//     } catch (err) {
//         console.error("Помилка оновлення профілю:", err.message);
//         res.status(500).json({ error: "Помилка сервера при оновленні" });
//     }
// });

// // ==========================================
// // МАРШРУТ ВИДАЛЕННЯ АКАУНТА (DELETE)
// // ==========================================
// app.delete('/api/user/:id', authenticateToken, async (req, res) => {
//     const { id } = req.params;

//     try {
//         // Видаляємо користувача з бази даних
//         const result = await pool.query(
//             "DELETE FROM users WHERE user_id = $1 RETURNING *",
//             [id]
//         );

//         // Якщо користувача з таким ID не було в базі
//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: "Користувача не знайдено" });
//         }

//         res.json({ message: "Акаунт успішно видалено" });

//     } catch (err) {
//         console.error("Помилка видалення акаунта:", err.message);
//         res.status(500).json({ error: "Помилка сервера при видаленні акаунта" });
//     }
// });

// // ==========================================
// // МАРШРУТ ЗАВАНТАЖЕННЯ АВАТАРА (POST)
// // ==========================================
// app.post('/api/user/:id/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
//     const { id } = req.params;

//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: "Файл не завантажено" });
//         }

//         // Формуємо шлях до файлу (наприклад: /uploads/1678901234.jpg)
//         const avatarUrl = `/uploads/${req.file.filename}`;

//         // Оновлюємо посилання в базі даних
//         const result = await pool.query(
//             "UPDATE users SET avatar = $1 WHERE user_id = $2 RETURNING avatar",
//             [avatarUrl, id]
//         );

//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: "Користувача не знайдено" });
//         }

//         res.json({
//             message: "Аватар успішно оновлено!",
//             avatarUrl: avatarUrl
//         });

//     } catch (err) {
//         console.error("Помилка завантаження аватара:", err.message);
//         res.status(500).json({ error: "Помилка сервера" });
//     }
// });

// // ==========================================
// // МАРШРУТИ БРОНЮВАННЯ (BOOKINGS)
// // ==========================================

// // 1. СТВОРЕННЯ БРОНЮВАННЯ
// app.post('/api/bookings', authenticateToken, async (req, res) => {
//     try {
//         const { user_id, seat_id, seat_label, booking_date, start_time, duration_hours, total_price, extras } = req.body;

//         if (!user_id || !seat_id || !booking_date || !start_time || !duration_hours) {
//             return res.status(400).json({ error: "Недостатньо даних для бронювання" });
//         }

//         // --- НОВИЙ БЛОК: Перевірка на перетин часу (Overlap Check) ---
//         // Логіка: Початок існуючої броні < Кінець нової броні АНД Кінець існуючої броні > Початок нової броні
//         const overlapQuery = `
//             SELECT * FROM bookings 
//             WHERE seat_id = $1 
//               AND booking_date = $2 
//               AND status = 'active'
//               AND start_time < ($3::time + $4::int * interval '1 hour')
//               AND (start_time + duration_hours * interval '1 hour') > $3::time
//         `;

//         const overlapResult = await pool.query(overlapQuery, [seat_id, booking_date, start_time, duration_hours]);

//         if (overlapResult.rows.length > 0) {
//             return res.status(409).json({
//                 error: "На жаль, цей стіл вже заброньовано на обраний час. Будь ласка, оберіть іншу годину або інше місце."
//             });
//         }
//         // --- КІНЕЦЬ НОВОГО БЛОКУ ---

//         const extrasJson = JSON.stringify(extras || []);

//         const newBooking = await pool.query(
//             `INSERT INTO bookings (user_id, seat_id, seat_label, booking_date, start_time, duration_hours, total_price, extras) 
//              VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
//             [user_id, seat_id, seat_label, booking_date, start_time, duration_hours, total_price, extrasJson]
//         );

//         res.status(201).json({ message: "Успішно заброньовано", booking: newBooking.rows[0] });
//     } catch (err) {
//         console.error("Помилка створення бронювання:", err.message);
//         res.status(500).json({ error: "Помилка сервера при створенні бронювання" });
//     }
// });

// // 2. ОТРИМАННЯ БРОНЮВАНЬ КОРИСТУВАЧА
// app.get('/api/user/:id/bookings', authenticateToken, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const bookings = await pool.query(
//             "SELECT * FROM bookings WHERE user_id = $1 ORDER BY booking_date DESC, created_at DESC",
//             [id]
//         );
//         res.json(bookings.rows);
//     } catch (err) {
//         console.error("Помилка отримання бронювань:", err.message);
//         res.status(500).json({ error: "Помилка сервера при отриманні бронювань" });
//     }
// });

// // ==========================================
// // ОТРИМАННЯ ЗАЙНЯТИХ МІСЦЬ ДЛЯ КАРТИ
// // ==========================================
// app.get('/api/bookings/occupied', authenticateToken, async (req, res) => {
//     try {
//         const { date, start_time, duration_hours } = req.query;

//         if (!date || !start_time || !duration_hours) {
//             return res.json([]);
//         }

//         const query = `
//             SELECT seat_id FROM bookings 
//             WHERE booking_date = $1 
//               AND status = 'active'
//               AND start_time < ($2::time + $3::int * interval '1 hour')
//               AND (start_time + duration_hours * interval '1 hour') > $2::time
//         `;

//         const result = await pool.query(query, [date, start_time, duration_hours]);

//         // Повертаємо лише масив ID (наприклад: ["desk-123", "round_table-456"])
//         const occupiedSeats = result.rows.map(row => row.seat_id);

//         res.json(occupiedSeats);
//     } catch (err) {
//         console.error("Помилка отримання зайнятих місць:", err.message);
//         res.status(500).json({ error: "Помилка сервера" });
//     }
// });


// // ==========================================
// // МАРШРУТИ АДМІНІСТРАТОРА (ADMIN API)
// // ==========================================

// // 1. Отримати список всіх користувачів
// app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
//     try {
//         const result = await pool.query(
//             // Додали banned та banned_time
//             "SELECT user_id, full_name, email, phone, role, balance, created_at, avatar, banned, banned_time FROM users ORDER BY created_at DESC"
//         );
//         res.json(result.rows);
//     } catch (err) {
//         console.error("Помилка отримання користувачів:", err.message);
//         res.status(500).json({ error: "Помилка сервера" });
//     }
// });

// // 2. Видалити користувача (Адмін)
// app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
//     try {
//         const { id } = req.params;
//         await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
//         res.json({ message: "Користувача успішно видалено" });
//     } catch (err) {
//         console.error("Помилка видалення:", err.message);
//         res.status(500).json({ error: "Помилка сервера" });
//     }
// });

// // 3. НОВИЙ МАРШРУТ: Забанити / Розбанити користувача
// app.patch('/api/admin/users/:id/ban', authenticateToken, isAdmin, async (req, res) => {
//     const { id } = req.params;
//     const { banned } = req.body; // Отримуємо бажаний статус: true або false

//     try {
//         let query;
//         let values;

//         if (banned) {
//             // Якщо банимо — встановлюємо banned = true та поточний час
//             query = "UPDATE users SET banned = true, banned_time = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *";
//             values = [id];
//         } else {
//             // Якщо розбанюємо — встановлюємо banned = false та обнуляємо час
//             query = "UPDATE users SET banned = false, banned_time = NULL WHERE user_id = $1 RETURNING *";
//             values = [id];
//         }

//         const result = await pool.query(query, values);

//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: "Користувача не знайдено" });
//         }

//         res.json({ message: banned ? "Користувача забанено" : "Користувача розбанено", user: result.rows[0] });

//     } catch (err) {
//         console.error("Помилка зміни статусу бану:", err.message);
//         res.status(500).json({ error: "Помилка сервера" });
//     }
// });

// // 4. Отримати статистику конкретного користувача
// app.get('/api/admin/users/:id/stats', authenticateToken, isAdmin, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const statsQuery = `
//             SELECT 
//                 COUNT(*) as total_bookings,
//                 COUNT(*) FILTER (WHERE status = 'active') as active_bookings,
//                 COALESCE(SUM(total_price), 0) as total_spent
//             FROM bookings
//             WHERE user_id = $1
//         `;
//         const result = await pool.query(statsQuery, [id]);
//         res.json(result.rows[0]);
//     } catch (err) {
//         console.error("Помилка отримання статистики користувача:", err.message);
//         res.status(500).json({ error: "Помилка сервера" });
//     }
// });

// // 5. Оновити дані користувача (Адмін)
// app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { full_name, phone, role } = req.body;

//         const result = await pool.query(
//             "UPDATE users SET full_name = $1, phone = $2, role = $3 WHERE user_id = $4 RETURNING *",
//             [full_name, phone, role, id]
//         );

//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: "Користувача не знайдено" });
//         }

//         res.json({ message: "Дані користувача оновлено", user: result.rows[0] });
//     } catch (err) {
//         console.error("Помилка оновлення користувача:", err.message);
//         res.status(500).json({ error: "Помилка сервера" });
//     }
// });

// // 6. Отримання загальної статистики
// app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
//     try {
//         const { startDate, endDate, seatId } = req.query;

//         // Базові параметри для запиту
//         let values = [startDate, endDate];
//         let seatFilter = seatId ? `AND seat_id = $3` : '';
//         if (seatId) values.push(seatId);

//         // 1. Запит для загальних підсумків
//         const summaryQuery = `
//             SELECT 
//                 COUNT(booking_id) as total_bookings,
//                 COALESCE(SUM(total_price), 0) as total_revenue,
//                 COUNT(CASE WHEN status = 'active' THEN 1 END) as active_bookings,
//                 COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
//             FROM bookings
//             WHERE booking_date >= $1 AND booking_date <= $2 ${seatFilter}
//         `;
//         const summaryResult = await pool.query(summaryQuery, values);

//         // 2. Запит для розбивки по днях (щоб намалювати графік)
//         const dailyQuery = `
//             SELECT 
//                 TO_CHAR(booking_date, 'YYYY-MM-DD') as date,
//                 COUNT(booking_id) as daily_bookings,
//                 COALESCE(SUM(total_price), 0) as daily_revenue
//             FROM bookings
//             WHERE booking_date >= $1 AND booking_date <= $2 ${seatFilter}
//             GROUP BY booking_date
//             ORDER BY booking_date ASC
//         `;
//         const dailyResult = await pool.query(dailyQuery, values);

//         res.json({
//             summary: summaryResult.rows[0],
//             daily: dailyResult.rows
//         });
//     } catch (err) {
//         console.error("Помилка отримання статистики:", err.message);
//         res.status(500).json({ error: "Помилка сервера" });
//     }
// });

// // 7. Отримання всіх бронювань з гнучкою фільтрацією
// app.get('/api/admin/bookings', authenticateToken, isAdmin, async (req, res) => {
//     try {
//         // Додали параметр timeframe
//         const { date, status, timeframe } = req.query;

//         let query = `
//             SELECT b.*, u.full_name, u.email, u.phone 
//             FROM bookings b
//             LEFT JOIN users u ON b.user_id = u.user_id
//             WHERE 1=1
//         `;
//         const values = [];
//         let valueIndex = 1;

//         // Логіка періоду
//         if (timeframe === 'past') {
//             query += ` AND b.booking_date < CURRENT_DATE`;
//         } else if (timeframe === 'upcoming') {
//             query += ` AND b.booking_date >= CURRENT_DATE`;
//         } else if (timeframe === 'specific' && date) {
//             query += ` AND b.booking_date = $${valueIndex}`;
//             values.push(date);
//             valueIndex++;
//         }
//         // Якщо timeframe === 'all', ми просто не додаємо умов по даті

//         if (status && status !== 'all') {
//             query += ` AND b.status = $${valueIndex}`;
//             values.push(status);
//             valueIndex++;
//         }

//         query += ` ORDER BY b.booking_date DESC, b.start_time DESC`;

//         const result = await pool.query(query, values);
//         res.json(result.rows);
//     } catch (err) {
//         console.error("Помилка отримання бронювань:", err.message);
//         res.status(500).json({ error: "Помилка сервера" });
//     }
// });

// // 8. Скасування бронювання (Адміном)
// app.patch('/api/admin/bookings/:id/cancel', authenticateToken, isAdmin, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const result = await pool.query(
//             "UPDATE bookings SET status = 'cancelled' WHERE booking_id = $1 RETURNING *",
//             [id]
//         );

//         if (result.rows.length === 0) {
//             return res.status(404).json({ error: "Бронювання не знайдено" });
//         }

//         res.json({ message: "Бронювання скасовано", booking: result.rows[0] });
//     } catch (err) {
//         console.error("Помилка скасування бронювання:", err.message);
//         res.status(500).json({ error: "Помилка сервера" });
//     }
// });

// app.listen(PORT, (err) => {
//     if (err) throw err;
//     console.log(`Server is running on port ${PORT}`);
// });