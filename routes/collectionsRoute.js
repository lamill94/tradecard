//add router instance
const router = require("express").Router();

//import the "mysql2" module
const mysql = require("mysql2");

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

//SQL queries
const allCollectionsQuery = `SELECT * FROM member_collection 
INNER JOIN collection ON member_collection.collection_id = collection.collection_id
INNER JOIN member ON member_collection.member_id = member.member_id`;

const myCollectionsQuery = `SELECT * FROM member_collection 
INNER JOIN collection ON member_collection.collection_id = collection.collection_id
INNER JOIN member ON member_collection.member_id = member.member_id
WHERE member_collection.member_id = ?`;

const otherCollectionsQuery = `SELECT * FROM member_collection 
INNER JOIN collection ON member_collection.collection_id = collection.collection_id
INNER JOIN member ON member_collection.member_id = member.member_id
WHERE member_collection.member_id != ?`;

//function to fetch collections
function fetchCollections(memberid, renderCallback) {
    
    connection.query(allCollectionsQuery, (err, allCollections) => {
        if (err) throw err;

        connection.query(myCollectionsQuery, [memberid], (err, myCollections) => {
            if (err) throw err;

            connection.query(otherCollectionsQuery, [memberid], (err, otherCollections) => {
                if (err) throw err;

                renderCallback(allCollections, myCollections, otherCollections);
            });
        });
    });
}

//set up a route handler for HTTP GET requests to the "/collections" endpoint
router.get("/collections", (req, res) => {

    const memberid = req.session.memberid;

    fetchCollections(memberid, (allCollections, myCollections, otherCollections) => {
        res.render('collections', {
            allCollections: allCollections, myCollections: myCollections,
            otherCollections: otherCollections, collectionExistsNotification: false, emptyNameNotification: false,
            collectionAddedNotification: false, isAuthenticated: req.session.authen,
            displayName: req.session.displayName
        });
    });
});

//set up a route handler for HTTP POST requests to the "/collections" endpoint
router.post('/collections', (req, res) => {

    //get user's member_id
    const memberid = req.session.memberid;

    //check what user entered for new collection name
    const collectionname = req.body.newCollectionField;

    //if user entered nothing then show empty name notification
    if (!collectionname) {

        fetchCollections(memberid, (allCollections, myCollections, otherCollections) => {
            res.render('collections', {
                allCollections: allCollections, myCollections: myCollections,
                otherCollections: otherCollections, collectionExistsNotification: false, emptyNameNotification: true,
                collectionAddedNotification: false, isAuthenticated: req.session.authen,
                displayName: req.session.displayName
            });
        });

    } else {

        //select user's collections
        const checkname = `SELECT * FROM member_collection 
        INNER JOIN collection ON collection.collection_id = member_collection.collection_id
        WHERE member_id = ${memberid} AND collection_name = "${collectionname}"`;

        connection.query(checkname, (err, rows) => {
            if (err) throw err;
            const numRows = rows.length;

            //if user already has collection with same name then show collection exists notification
            if (numRows > 0) {

                fetchCollections(memberid, (allCollections, myCollections, otherCollections) => {
                    res.render('collections', {
                        allCollections: allCollections, myCollections: myCollections,
                        otherCollections: otherCollections, collectionExistsNotification: true,
                        emptyNameNotification: false, collectionAddedNotification: false,
                        isAuthenticated: req.session.authen, displayName: req.session.displayName
                    });
                });

            } else {

                //else if collection name is unique then insert new collection
                const createCollectionSql = `INSERT INTO collection (collection_name) VALUES( ? );`;

                connection.query(createCollectionSql, [collectionname], (err, rows) => {
                    if (err) throw err;
                    const newCollectionId = rows.insertId;

                    //then insert new collection with member_id into the member_collection table
                    const createMemCollectionSql = `INSERT INTO member_collection (member_id, collection_id) VALUES( ? , ? );`;

                    connection.query(createMemCollectionSql, [memberid, newCollectionId], (err, rows) => {
                        if (err) throw err;

                        fetchCollections(memberid, (allCollections, myCollections, otherCollections) => {
                            res.render('collections', {
                                allCollections: allCollections, myCollections: myCollections,
                                otherCollections: otherCollections, collectionExistsNotification: false,
                                emptyNameNotification: false, collectionAddedNotification: true,
                                isAuthenticated: req.session.authen, displayName: req.session.displayName
                            });
                        });
                    });
                });
            }
        });
    }
});

//export the instance
module.exports = router;