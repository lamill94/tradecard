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
const myCollectionsQuery = `SELECT * FROM member_collection 
INNER JOIN collection ON member_collection.collection_id = collection.collection_id
INNER JOIN member ON member_collection.member_id = member.member_id
WHERE member_collection.member_id = ?`;

//set up a route handler for HTTP GET requests to the "/collection" endpoint
router.get("/collection", (req, res) => {

    const memberCollectionId = req.query.member_collection_id;
    const memberid = req.session.memberid;
    const sort = req.query.sort;

    if (sort) {
        if (Array.isArray(sort)) {
            orderByClause = `ORDER BY ${sort[0]}, ${sort[1]}`;
        } else {
            orderByClause = `ORDER BY ${sort}`;
        }
    } else {
        orderByClause = `ORDER BY release_date, card_number`;
    }

    const cardsInCollectionSql = `SELECT member_collection_id, display_name, collection_name, card.card_id AS 'card_id', 
   card_name, hp, a.energy_type_name, a.energy_type_url, stage, evolves_from, b.energy_type_name AS 
   'weakness_energy_type_name', b.energy_type_url AS 'weakness_energy_type_url', c.energy_type_name AS 
   'resistance_energy_type_name', c.energy_type_url AS 'resistance_energy_type_url', resistance_number, 
   d.energy_type_url AS 'retreat_energy_type_url', retreat_cost, expansion_name, total_cards, expansion_url, 
   release_date, card_number, rarity_name, market_price, image_url FROM member_collection
   INNER JOIN member ON member_collection.member_id = member.member_id
   INNER JOIN collection ON member_collection.collection_id = collection.collection_id
   INNER JOIN collection_card ON collection.collection_id = collection_card.collection_id
   INNER JOIN card ON collection_card.card_id = card.card_id
   INNER JOIN energy_type a ON card.energy_type_id = a.energy_type_id
   INNER JOIN stage ON card.stage_id = stage.stage_id
   INNER JOIN energy_type b ON card.weakness_energy_type_id = b.energy_type_id
   INNER JOIN energy_type c ON card.resistance_energy_type_id = c.energy_type_id
   INNER JOIN energy_type d ON card.retreat_energy_type_id = d.energy_type_id
   INNER JOIN expansion ON card.expansion_id = expansion.expansion_id
   INNER JOIN rarity ON card.rarity_id = rarity.rarity_id
   WHERE member_collection_id = ?
   ${orderByClause}`;

    connection.query(cardsInCollectionSql, [memberCollectionId], (err, rows) => {
        if (err) throw err;

        const isEmptyCollection = rows.length === 0;

        connection.query(myCollectionsQuery, [memberid], (err, myCollections) => {
            if (err) throw err;

            if (isEmptyCollection) {

                const readsql = `SELECT * FROM member_collection
                INNER JOIN member ON member_collection.member_id = member.member_id
                INNER JOIN collection ON member_collection.collection_id = collection.collection_id
                WHERE member_collection_id = ?`;

                connection.query(readsql, [memberCollectionId], (err, rows) => {
                    if (err) throw err;

                    res.render('collection', {
                        rowdata: rows, myCollections: myCollections, isEmptyCollection: isEmptyCollection,
                        isAuthenticated: req.session.authen, displayName: req.session.displayName
                    });
                });

            } else {

                res.render('collection', {
                    rowdata: rows, myCollections: myCollections, isEmptyCollection: isEmptyCollection,
                    isAuthenticated: req.session.authen, displayName: req.session.displayName
                });
            }
        });
    });
});

//set up a route handler for HTTP POST requests to the "/collection" endpoint
router.post('/collection', (req, res) => {

    const memberCollectionId = req.body.member_collection_id;
    const cardId = req.body.card_id;
    const redirectPage = req.query.redirect;

    const checkCollectionId = `SELECT collection_id FROM member_collection 
    WHERE member_collection_id = ${memberCollectionId}`;

    connection.query(checkCollectionId, (err, rows) => {
        if (err) throw err;
        const collectionId = rows[0]['collection_id'];

        const addCardToCollectionSql = `INSERT INTO collection_card (collection_id, card_id) VALUES( ? , ? );`;

        connection.query(addCardToCollectionSql, [collectionId, cardId], (err, rows) => {
            if (err) throw err;

            //this needs fixed to take into account sort for browse, collection & wishlist
            if (redirectPage === 'browse') {
                res.redirect('/browse');
            } else if (redirectPage === 'collection') {
                res.redirect(`/collection?member_collection_id=${memberCollectionId}`);
            } else if (redirectPage === 'card') {
                res.redirect(`/card?card_id=${cardId}`);
            } else if (redirectPage === 'wishlist') {
                res.redirect('/wishlist');
            }
        });
    });
});

//export the instance
module.exports = router;