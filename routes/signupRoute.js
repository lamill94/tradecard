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
    res.render('signup', { userExistsNotification: false, emptyFieldNotification: false, isAuthenticated: req.session.authen });
});

//set up a route handler for HTTP POST requests to the "/signup" endpoint
router.post('/signup', (req, res) => {
    const displayname = req.body.displayNameField;
    const useremail = req.body.emailField;
    const password = req.body.passwordField;

    if (!displayname || !useremail || !password) {
        return res.render('signup', { emptyFieldNotification: true, userExistsNotification: false, isAuthenticated: req.session.authen });
    }

    const checkuser = `SELECT * FROM member WHERE email_address = "${useremail}"`;

    connection.query(checkuser, (err, rows) => {
        if (err) throw err;
        const numRows = rows.length;

        if (numRows > 0) {
            res.render('signup', { userExistsNotification: true, emptyFieldNotification: false, isAuthenticated: req.session.authen });
        } else {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    console.error(err);
                    return;
                }

                const createsql = `INSERT INTO member (display_name, email_address, password) VALUES( ? , ? , ?);`;

                connection.query(createsql, [displayname, useremail, hash], (err, rows) => {
                    if (err) throw err;

                    const checkuser = `SELECT * FROM member WHERE email_address = "${useremail}"`;

                    connection.query(checkuser, (err, rows) => {
                        if (err) throw err;
                        const user = rows[0];
                        const sessionobj = req.session;
                        sessionobj.authen = true;
                        sessionobj.displayName = user.display_name;
                        sessionobj.memberid = user.member_id;
                        res.redirect('/');
                    });
                });
            });
        }
    });
});

//export the instance
module.exports = router;