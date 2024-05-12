//import modules
const router = require("express").Router();
const connection = require("../connection");
const bcrypt = require('bcrypt');

//set up a route handler for HTTP GET requests to the "/login" endpoint
router.get("/login", (req, res) => {
    res.render('login', {
        noEmailNotification: false, passwordNotification: false, emptyFieldNotification: false,
        isAuthenticated: req.session.authen
    });
});

//set up a route handler for HTTP POST requests to the "/login" endpoint
router.post('/login', (req, res) => {

    //get entered fields
    const useremail = req.body.emailField;
    const password = req.body.passwordField;

    //if username or password isn't populated then show empty field notification
    if (!useremail || !password) {
        return res.render('login', {
            emptyFieldNotification: true, noEmailNotification: false,
            passwordNotification: false, isAuthenticated: req.session.authen
        });
    }

    //sql query to get all member info where email address is equal to login email address
    const checkuser = `SELECT * FROM member WHERE email_address = "${useremail}"`;

    connection.query(checkuser, (err, rows) => {
        if (err) throw err;
        const numRows = rows.length;

        //if email address exists
        if (numRows > 0) {
            const user = rows[0];

            //if entered password matches stored password then set session to true and set their display 
            //name and memberid for use
            if (bcrypt.compareSync(password, user.password)) {
                const sessionobj = req.session;
                sessionobj.authen = true;
                sessionobj.displayName = user.display_name;
                sessionobj.memberid = user.member_id;
                res.redirect('/');

                //else if entered password doesn't match stored password then show invalid PW notification
            } else {
                res.render('login', {
                    passwordNotification: true, noEmailNotification: false,
                    emptyFieldNotification: false, isAuthenticated: req.session.authen
                });
            }

            //else if email doesn't exist then show invalid email notification
        } else {
            res.render('login', {
                noEmailNotification: true, passwordNotification: false,
                emptyFieldNotification: false, isAuthenticated: req.session.authen
            });
        }
    });
});

//export the instance
module.exports = router;