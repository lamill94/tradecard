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

//set up a route handler for HTTP GET requests to the "/collection" endpoint
router.get("/collection", (req, res) => {
    const showid = req.query.member_collection_id;
    const readsql = `SELECT member_collection_id, display_name, collection_name, card.card_id AS 'card_id', 
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
   ORDER BY release_date, card_number ASC`;

    connection.query(readsql, [showid], (err, rows) => {
        if (err) throw err;
        const isEmptyCollection = rows.length === 0;

        if (isEmptyCollection) {

            const readsql = `SELECT * FROM member_collection
            INNER JOIN member ON member_collection.member_id = member.member_id
            INNER JOIN collection ON member_collection.collection_id = collection.collection_id
            WHERE member_collection_id = ?`;

            connection.query(readsql, [showid], (err, rows) => {
                if (err) throw err;
                res.render('collection', { rowdata: rows, isEmptyCollection: isEmptyCollection, isAuthenticated: req.session.authen, displayName: req.session.displayName });
            });

        } else {
            res.render('collection', { rowdata: rows, isEmptyCollection: isEmptyCollection, isAuthenticated: req.session.authen, displayName: req.session.displayName });
        }
    });
});

//set up a route handler for HTTP GET requests to the "/collection/sort" endpoint
router.get("/collection/sort", (req, res) => {
    const showid = req.query.member_collection_id;
    const sort = req.query.sort;
    let orderByClause = '';

    if (Array.isArray(sort)) {
        orderByClause = `ORDER BY ${sort[0]}, ${sort[1]} ASC`;
    } else {
        orderByClause = `ORDER BY ${sort}`;
    }

    const readsql = `SELECT member_collection_id, display_name, collection_name, card.card_id AS 'card_id', 
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

    connection.query(readsql, [showid], (err, rows) => {
        if (err) throw err;
        res.render('collection', { rowdata: rows, isEmptyCollection: false, isAuthenticated: req.session.authen, displayName: req.session.displayName });
    });
});

//export the instance
module.exports = router;