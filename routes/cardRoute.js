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

//set up a route handler for HTTP GET requests to the "/card" endpoint
router.get("/card", (req, res) => {
    const showid = req.query.card_id;
    const readsql = `SELECT card_id, card_name, hp, a.energy_type_name, a.energy_type_url, stage, evolves_from, 
    b.energy_type_name AS 'weakness_energy_type_name', b.energy_type_url AS 'weakness_energy_type_url', 
    c.energy_type_name AS 'resistance_energy_type_name', c.energy_type_url AS 'resistance_energy_type_url', 
    resistance_number, d.energy_type_url AS 'retreat_energy_type_url', retreat_cost, expansion_name, total_cards, expansion_url, 
    card_number, rarity_name, market_price, image_url FROM card 
    INNER JOIN energy_type a ON card.energy_type_id = a.energy_type_id
    INNER JOIN stage ON card.stage_id = stage.stage_id
    INNER JOIN energy_type b ON card.weakness_energy_type_id = b.energy_type_id
    INNER JOIN energy_type c ON card.resistance_energy_type_id = c.energy_type_id
    INNER JOIN energy_type d ON card.retreat_energy_type_id = d.energy_type_id
    INNER JOIN expansion ON card.expansion_id = expansion.expansion_id
    INNER JOIN rarity ON card.rarity_id = rarity.rarity_id
    WHERE card_id = ?`;

    connection.query(readsql, [showid], (err, rows) => {
        if (err) throw err;

        const cardData = {
            name: rows[0]['card_name'],
            hp: rows[0]['hp'],
            energy_type_url: rows[0]['energy_type_url'],
            stage: rows[0]['stage'],
            evolves_from: rows[0]['evolves_from'],
            weakness_energy_type_url: rows[0]['weakness_energy_type_url'],
            resistance_energy_type_url: rows[0]['resistance_energy_type_url'],
            resistance_number: rows[0]['resistance_number'],
            retreat_energy_type_url: rows[0]['retreat_energy_type_url'],
            retreat_cost: rows[0]['retreat_cost'],
            expansion_name: rows[0]['expansion_name'],
            total_cards: rows[0]['total_cards'],
            card_number: rows[0]['card_number'],
            rarity_name: rows[0]['rarity_name'],
            market_price: rows[0]['market_price'],
            image_url: rows[0]['image_url']
        };

        res.render('card', { card: cardData, isAuthenticated: req.session.authen });
    });
});

//export the instance
module.exports = router;