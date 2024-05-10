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

const displayAccountSql = `SELECT * FROM member WHERE member_id = ?`;

//set up a route handler for HTTP GET requests to the "/account" endpoint
router.get("/account", (req, res) => {

    const memberid = req.session.memberid;

    connection.query(displayAccountSql, [memberid], (err, rows) => {
        if (err) throw err;

        req.session.displayName = rows[0].display_name;

        res.render('account', {
            rowdata: rows, emptyDisplayNameNotification: false, emptyEmailAddressNotification: false,
            emptyPasswordNotification: false, isAuthenticated: req.session.authen,
            displayName: req.session.displayName
        });
    });
});

// set up a route handler for HTTP POST requests to the "/account/newDisplayName" endpoint
router.post("/account/newDisplayName", (req, res) => {

    const memberid = req.session.memberid;
    const newDisplayName = req.body.displayNameField;

    // if newDisplayName isn't populated then show empty field notification
    if (!newDisplayName) {

        connection.query(displayAccountSql, [memberid], (err, rows) => {
            if (err) throw err;

            return res.render('account', {
                rowdata: rows, emptyDisplayNameNotification: true, emptyEmailAddressNotification: false,
                emptyPasswordNotification: false, isAuthenticated: req.session.authen,
                displayName: req.session.displayName
            });
        });

        // else if newDisplayName is populated then update
    } else {

        const updateDisplayNameSql = `UPDATE member SET display_name = ? WHERE member_id = ?`;

        connection.query(updateDisplayNameSql, [newDisplayName, memberid], (err, result) => {
            if (err) throw err;

            res.redirect("/account");
        });
    }
});

// set up a route handler for HTTP POST requests to the "/account/newEmailAddress" endpoint
router.post("/account/newEmailAddress", (req, res) => {

    const memberid = req.session.memberid;
    const newEmailAddress = req.body.emailField;

    // if newEmailAddress isn't populated then show empty field notification
    if (!newEmailAddress) {

        connection.query(displayAccountSql, [memberid], (err, rows) => {
            if (err) throw err;

            return res.render('account', {
                rowdata: rows, emptyDisplayNameNotification: false, emptyEmailAddressNotification: true,
                emptyPasswordNotification: false, isAuthenticated: req.session.authen,
                displayName: req.session.displayName
            });
        });

        // else if newEmailAddress is populated then update
    } else {

        const updateEmailAddressSql = `UPDATE member SET email_address = ? WHERE member_id = ?`;

        connection.query(updateEmailAddressSql, [newEmailAddress, memberid], (err, result) => {
            if (err) throw err;

            res.redirect("/account");
        });
    }
});

// set up a route handler for HTTP POST requests to the "/account/newPassword" endpoint
router.post("/account/newPassword", (req, res) => {

    const memberid = req.session.memberid;
    const newPassword = req.body.passwordField;

    // if newPassword isn't populated then show empty field notification
    if (!newPassword) {

        connection.query(displayAccountSql, [memberid], (err, rows) => {
            if (err) throw err;

            return res.render('account', {
                rowdata: rows, emptyDisplayNameNotification: false, emptyEmailAddressNotification: false,
                emptyPasswordNotification: true, isAuthenticated: req.session.authen,
                displayName: req.session.displayName
            });
        });

        // else if newPassword is populated then update
    } else {

        bcrypt.hash(newPassword, 10, (err, hash) => {
            if (err) {
                console.error(err);
                return;
            }

            // SQL query to update the password in the member table
            const updatePasswordSql = `UPDATE member SET password = ? WHERE member_id = ?`;

            connection.query(updatePasswordSql, [hash, memberid], (err, result) => {
                if (err) throw err;

                res.redirect("/account");
            });
        });
    }
});

//set up a route handler for HTTP DELETE requests to the "/account" endpoint
router.post('/account/delete', (req, res) => {

    const memberid = req.session.memberid;

    // sql query to delete all user's cards from the wishlist_card table
    const deleteWishlistCardsSql = `DELETE FROM wishlist_card WHERE wishlist_id IN (SELECT wishlist_id FROM wishlist WHERE member_id = ?)`;

    connection.query(deleteWishlistCardsSql, [memberid], (err, result) => {
        if (err) throw err;

        // sql query to delete the user's wishlist 
        const deleteWishlistSql = `DELETE FROM wishlist WHERE member_id = ?`;

        connection.query(deleteWishlistSql, [memberid], (err, result) => {
            if (err) throw err;

            // sql query to delete all user's cards from the collection_card table
            const deleteCollectionCardsSql = `DELETE FROM collection_card WHERE collection_id IN (SELECT collection_id FROM member_collection WHERE member_id = ?)`;

            connection.query(deleteCollectionCardsSql, [memberid], (err, result) => {
                if (err) throw err;

                // sql query to delete all user's collections from the collection, collection_comment & member_collection table
                const getCollectionIds = `SELECT collection_id FROM member_collection WHERE member_id = ?`;

                connection.query(getCollectionIds, [memberid], (err, result) => {
                    if (err) throw err;

                    let collectionIds;

                    if (Array.isArray(result) && result.length > 0) {
                        collectionIds = result.map(row => row.collection_id);
                    } else if (result && typeof result === 'object') {
                        collectionIds = [result.collection_id];
                    } else {
                        collectionIds = [];
                    }

                    const deleteMemberCollectionSql = `DELETE FROM member_collection WHERE member_id = ?`;

                    connection.query(deleteMemberCollectionSql, [memberid], (err, result) => {
                        if (err) throw err;

                        const deleteCollectionCommentsSql = `DELETE FROM collection_comment WHERE collection_id IN (${collectionIds})`;

                        connection.query(deleteCollectionCommentsSql, (err, result) => {
                            if (err) throw err;

                            const deleteCollectionSql = `DELETE FROM collection WHERE collection_id IN (${collectionIds})`;

                            connection.query(deleteCollectionSql, (err, result) => {

                                // sql query to delete member from member table
                                const deleteMemberSql = `DELETE FROM member WHERE member_id = ?`;

                                connection.query(deleteMemberSql, [memberid], (err, result) => {
                                    if (err) throw err;

                                    res.redirect(`/logout`);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

//export the instance
module.exports = router;