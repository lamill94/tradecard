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

//set up a route handler for HTTP GET requests to the "/account" endpoint
router.get("/account", (req, res) => {

    const memberid = req.session.memberid;

    const readsql = `SELECT * FROM member WHERE member_id = ?`;

    connection.query(readsql, [memberid], (err, rows) => {
        if (err) throw err;

        const memberData = {
            email: rows[0]['email_address'],
            password: rows[0]['password']
        };

        res.render('account', { member: memberData, isAuthenticated: req.session.authen, displayName: req.session.displayName });
    });

});

//export the instance
module.exports = router;