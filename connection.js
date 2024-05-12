// Load environment variables
require('dotenv').config();

// Import the "mysql2" module
const mysql = require("mysql2");

// Create MySQL connection object
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    connectionLimit: process.env.DB_CONNECTION_LIMIT,
});

// Export the MySQL connection
module.exports = connection;
