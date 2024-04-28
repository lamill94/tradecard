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

//set up a route handler for HTTP GET requests to the "/card" endpoint
router.get("/card", (req, res) => {

    const cardId = req.query.card_id;
    const memberid = req.session.memberid;

    const cardDetailsSqlQuery = `SELECT card_id, card_name, hp, a.energy_type_name AS 'energy_type_name', 
    a.energy_type_url AS 'energy_type_url', stage, evolves_from, b.energy_type_name AS 'weakness_energy_type_name', 
    b.energy_type_url AS 'weakness_energy_type_url', c.energy_type_name AS 'resistance_energy_type_name', 
    c.energy_type_url AS 'resistance_energy_type_url', resistance_number, 
    d.energy_type_url AS 'retreat_energy_type_url', retreat_cost, expansion_name, total_cards, expansion_url, 
    card_number, rarity_name, market_price, image_url FROM card 
    INNER JOIN energy_type a ON card.energy_type_id = a.energy_type_id
    INNER JOIN stage ON card.stage_id = stage.stage_id
    INNER JOIN energy_type b ON card.weakness_energy_type_id = b.energy_type_id
    INNER JOIN energy_type c ON card.resistance_energy_type_id = c.energy_type_id
    INNER JOIN energy_type d ON card.retreat_energy_type_id = d.energy_type_id
    INNER JOIN expansion ON card.expansion_id = expansion.expansion_id
    INNER JOIN rarity ON card.rarity_id = rarity.rarity_id
    WHERE card_id = ?`;

    connection.query(cardDetailsSqlQuery, [cardId], (err, rows) => {
        if (err) throw err;

        connection.query(myCollectionsQuery, [memberid], (err, myCollections) => {
            if (err) throw err;

            res.render('card', {
                cardData: rows, myCollections: myCollections, isAuthenticated: req.session.authen,
                displayName: req.session.displayName
            });
        });
    });
});

//export the instance
module.exports = router;