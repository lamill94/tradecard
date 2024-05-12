//import the "mysql2" module
const mysql = require("mysql2");

//create mysql connection object
const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: '40108404',
    port: '3306',
    connectionLimit: 10,
});

//export the mysql connection
module.exports = connection;
