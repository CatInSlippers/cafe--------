const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Перевірка на авторизацію користувача
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Немає доступу. Будь ласка, увійдіть в акаунт." });
    }

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({ error: "Ваша сесія закінчилася. Увійдіть знову." });
        }
        req.user = decodedUser;
        next();
    });
};

// перевіряємо чи адмін
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Доступ заборонено. Тільки для адміністраторів." });
    }
    next();
};

module.exports = { authenticateToken, isAdmin };