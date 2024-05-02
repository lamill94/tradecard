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
    res.render('signup', {
        userExistsNotification: false, emptyFieldNotification: false,
        isAuthenticated: req.session.authen
    });
});

//set up a route handler for HTTP POST requests to the "/signup" endpoint
router.post('/signup', (req, res) => {

    //get entered fields
    const displayname = req.body.displayNameField;
    const useremail = req.body.emailField;
    const password = req.body.passwordField;

    //if at least one field isn't populated then show empty field notification
    if (!displayname || !useremail || !password) {
        return res.render('signup', {
            emptyFieldNotification: true, userExistsNotification: false,
            isAuthenticated: req.session.authen
        });
    }

    //sql query to get all member info where email address is equal to sign up email address
    const checkuser = `SELECT * FROM member WHERE email_address = "${useremail}"`;

    connection.query(checkuser, (err, rows) => {
        if (err) throw err;
        const numRows = rows.length;

        //if email address exists then show user exists notification
        if (numRows > 0) {
            res.render('signup', {
                userExistsNotification: true, emptyFieldNotification: false,
                isAuthenticated: req.session.authen
            });

            //else if user doesn't exist then hash the signup password using bcrypt
        } else {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    console.error(err);
                    return;
                }

                //insert signup details into SQL database
                const createUserSql = `INSERT INTO member (display_name, email_address, password) VALUES( ? , ? , ?);`;

                connection.query(createUserSql, [displayname, useremail, hash], (err, rows) => {
                    if (err) throw err;

                    //select all member details from new member to set session to true and to set their display 
                    //name and memberid for use
                    const newuser = `SELECT * FROM member WHERE email_address = "${useremail}"`;

                    connection.query(newuser, (err, rows) => {
                        if (err) throw err;
                        req.session.authen = true;
                        req.session.displayName = rows[0].display_name;
                        req.session.memberid = rows[0].member_id;

                        //insert wishlist for new user into SQL database
                        const createWishlistSql = `INSERT INTO wishlist (member_id) VALUES( ? );`;

                        connection.query(createWishlistSql, [req.session.memberid], (err, rows) => {
                            if (err) throw err;
                            res.redirect('/');
                        });
                    });
                });
            });
        }
    });
});

//export the instance
module.exports = router;