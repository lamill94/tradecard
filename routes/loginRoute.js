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

//set up a route handler for HTTP GET requests to the "/login" endpoint
router.get("/login", (req, res) => {
    res.render('login');
});

//set up a route handler for HTTP POST requests to the "/login" endpoint
router.post('/login', (req, res) => {
    const useremail = req.body.emailField;
    const password = req.body.passwordField;

    const checkuser = `SELECT * FROM member WHERE email_address = "${useremail}"`;

    connection.query(checkuser, (err, rows) => {
        if (err) throw err;
        const numRows = rows.length;

        if (numRows > 0) {
            const user = rows[0];

            if (bcrypt.compareSync(password, user.password)) {
                const sessionobj = req.session;
                sessionobj.authen = user.id;
                res.redirect('/browse');
            } else {
                res.redirect('/login');
                console.log(password);
                console.log(user.password);
            }
        } else {
            res.redirect('/');
        }
    });
});

//export the instance
module.exports = router;