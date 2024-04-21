//add router instance
const router = require("express").Router();

//import the "mysql2" module
const mysql = require("mysql2");

//create mysql connection object
const connection = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: '40108404',
        port: '3306',
    }
);

//establish connection to mysql database
connection.connect((err) => {
    if (err) {
        return console.log(err.message)
    } else {
        return console.log(`Connection to local MySQL DB.`)
    };
});

//set up a route handler for HTTP GET requests to the "/card" endpoint
router.get("/card", (req, res) => {
    const readsql = `SELECT * FROM card`;

    connection.query(readsql, (err, rows) => {
        if (err) throw err;
        res.render('card', { rowdata: rows });
    });
});

//export the instance
module.exports = router;