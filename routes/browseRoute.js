//add router instance
const router = require("express").Router();

//import the "mysql2" module
const mysql = require("mysql2");

//create mysql connection object
const connection = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: '40108404',
        port: '3306',
    }
);

//establish connection to mysql database
connection.connect((err) => {
    if (err) {
        return console.log(err.message)
    } else {
        return console.log(`Connection to local MySQL DB.`)
    };
});

//set up a route handler for HTTP GET requests to the "/browse" endpoint
router.get("/browse", (req, res) => {
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
    INNER JOIN rarity ON card.rarity_id = rarity.rarity_id`;

    connection.query(readsql, (err, rows) => {
        if (err) throw err;
        res.render('browse', { title: 'Cards', rowdata: rows });
    });
});

//export the instance
module.exports = router;