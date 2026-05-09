const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.PASWORD_DB,
    database: process.env.DB_NAME || 'cafe',
    host: process.env.DB_HOST,
    port: 5432,
    max: 100,
})

module.exports = pool;