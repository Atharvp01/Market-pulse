const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'stock_user',
    password: 'password',
    database: 'stock_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
