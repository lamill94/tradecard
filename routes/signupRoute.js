//add router instance
const router = require("express").Router();

//import the "mysql2" & the "bcrypt" module
const mysql = require("mysql2");
const bcrypt = require('bcrypt');

//create mysql connection object
const connection = mysql.createPool(
    {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: '40108404',
        port: '3306',
        connectionLimit: 10,
    }
);

//establish connection to mysql database
connection.getConnection((err) => {
    if (err) {
        return console.log(err.message)
    } else {
        return console.log(`Connection to local MySQL DB.`)
    };
});

//set up a route handler for HTTP GET requests to the "/signup" endpoint
router.get("/signup", (req, res) => {
    res.render('signup');
});

//set up a route handler for HTTP POST requests to the "/signup" endpoint
router.post('/signup', (req, res) => {
    const displayname = req.body.displayNameField;
    const useremail = req.body.emailField;
    const password = req.body.passwordField;

    let hashedPassword = bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error(err);
            return;
        }

        const createsql = `INSERT INTO member (display_name, email_address, password) VALUES( ? , ? , ?);`;

        connection.query(createsql, [displayname, useremail, hash], (err, rows) => {
            if (err) throw err;
            res.render('home');
        });
    });
});

//export the instance
module.exports = router;