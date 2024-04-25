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
    res.render('login', { noEmailNotification: false, passwordNotification: false, emptyFieldNotification: false, isAuthenticated: req.session.authen });
});

//set up a route handler for HTTP POST requests to the "/login" endpoint
router.post('/login', (req, res) => {
    const useremail = req.body.emailField;
    const password = req.body.passwordField;

    if (!useremail || !password) {
        return res.render('login', { emptyFieldNotification: true, noEmailNotification: false, passwordNotification: false, isAuthenticated: req.session.authen });
    }

    const checkuser = `SELECT * FROM member WHERE email_address = "${useremail}"`;

    connection.query(checkuser, (err, rows) => {
        if (err) throw err;
        const numRows = rows.length;

        if (numRows > 0) {
            const user = rows[0];

            if (bcrypt.compareSync(password, user.password)) {
                const sessionobj = req.session;
                sessionobj.authen = true;
                sessionobj.displayName = user.display_name;
                sessionobj.memberid = user.member_id;
                res.redirect('/');
            } else {
                res.render('login', { passwordNotification: true, noEmailNotification: false, emptyFieldNotification: false, isAuthenticated: req.session.authen });
            }
        } else {
            res.render('login', { noEmailNotification: true, passwordNotification: false, emptyFieldNotification: false, isAuthenticated: req.session.authen });
        }
    });
});

//export the instance
module.exports = router;