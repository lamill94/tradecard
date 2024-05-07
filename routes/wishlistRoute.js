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

//SQL queries for user's collections and filters
const myCollectionsQuery = `SELECT * FROM member_collection 
INNER JOIN collection ON member_collection.collection_id = collection.collection_id
INNER JOIN member ON member_collection.member_id = member.member_id
WHERE member_collection.member_id = ?`;

const hpQuery = `SELECT MIN(hp) AS 'min_hp', MAX(hp) AS 'max_hp' FROM card`;

const energyTypeQuery = `SELECT * FROM energy_type WHERE energy_type_id != 1`;

const stageQuery = `SELECT * FROM stage`;

const retreatCostQuery = `SELECT * FROM retreat_cost`;

const expansionQuery = `SELECT * FROM expansion`;

const rarityQuery = `SELECT * FROM rarity`;

const marketPriceQuery = `SELECT MIN(market_price) AS 'min_market_price', MAX(market_price) AS 'max_market_price' 
FROM card`;

//set up a route handler for HTTP GET requests to the "/wishlist" endpoint
router.get("/wishlist", (req, res) => {

    const memberid = req.session.memberid;
    const minHpFilter = req.query.min_hp;
    const maxHpFilter = req.query.max_hp;
    const energyTypeFilter = req.query.energy_type;
    const stageFilter = req.query.stage;
    const weaknessEnergyTypeFilter = req.query.weakness_energy_type;
    const resistanceEnergyTypeFilter = req.query.resistance_energy_type;
    const retreatCostFilter = req.query.retreat_cost;
    const expansionFilter = req.query.expansion_name;
    const rarityFilter = req.query.rarity_name;
    const minMarketPriceFilter = req.query.min_market_price;
    const maxMarketPriceFilter = req.query.max_market_price;
    const sort = req.query.sort;
    const search = req.query.search;

    //push filter clauses & search to the filterClauses array
    let filterClauses = [];

    if (minHpFilter && maxHpFilter) {
        filterClauses.push(`hp >= ${minHpFilter} AND hp <= ${maxHpFilter}`);
    } else if (minHpFilter) {
        filterClauses.push(`hp >= ${minHpFilter}`);
    } else if (maxHpFilter) {
        filterClauses.push(`hp <= ${maxHpFilter}`);
    }

    if (energyTypeFilter) {
        const energyTypes = energyTypeFilter.map(type => `'${type}'`).join(',');
        filterClauses.push(`a.energy_type_name IN (${energyTypes})`);
    }

    if (stageFilter) {
        const stages = stageFilter.map(type => `'${type}'`).join(',');
        filterClauses.push(`stage IN (${stages})`);
    }

    if (weaknessEnergyTypeFilter) {
        const weaknessEnergyTypes = weaknessEnergyTypeFilter.map(type => `'${type}'`).join(',');
        filterClauses.push(`b.energy_type_name IN (${weaknessEnergyTypes})`);
    }

    if (resistanceEnergyTypeFilter) {
        const resistanceEnergyTypes = resistanceEnergyTypeFilter.map(type => `'${type}'`).join(',');
        filterClauses.push(`c.energy_type_name IN (${resistanceEnergyTypes})`);
    }

    if (retreatCostFilter) {
        const retreatCosts = retreatCostFilter.map(type => `${type}`).join(',');
        filterClauses.push(`retreat_cost IN (${retreatCosts})`);
    }

    if (expansionFilter) {
        const expansions = expansionFilter.map(type => `'${type}'`).join(',');
        filterClauses.push(`expansion_name IN (${expansions})`);
    }

    if (rarityFilter) {
        const rarities = rarityFilter.map(type => `'${type}'`).join(',');
        filterClauses.push(`rarity_name IN (${rarities})`);
    }

    if (minMarketPriceFilter && maxMarketPriceFilter) {
        filterClauses.push(`market_price >= ${minMarketPriceFilter} AND market_price <= ${maxMarketPriceFilter}`);
    } else if (minMarketPriceFilter) {
        filterClauses.push(`market_price >= ${minMarketPriceFilter}`);
    } else if (maxMarketPriceFilter) {
        filterClauses.push(`market_price <= ${maxMarketPriceFilter}`);
    }

    if (search) {
        filterClauses.push(`card_name LIKE '%${search}%'`);
    }

    //combine all filter clauses into a single WHERE clause
    let whereClause = filterClauses.length > 0 ? `WHERE member_id = ${memberid} AND ${filterClauses.join(' AND ')}` : `WHERE member_id = ${memberid}`;

    //set orderByClause
    if (sort) {
        if (Array.isArray(sort)) {
            orderByClause = `ORDER BY ${sort[0]}, ${sort[1]}`;
        } else {
            orderByClause = `ORDER BY ${sort}`;
        }
    } else {
        orderByClause = `ORDER BY release_date, card_number`;
    }

    //query to render the cards including whereClause & orderByClause
    const wishlistCardsSqlQuery = `SELECT member_id, card.card_id AS 'card_id', card_name, hp, 
    a.energy_type_name AS 'energy_type_name', a.energy_type_url AS 'energy_type_url', stage, evolves_from, 
    b.energy_type_name AS 'weakness_energy_type_name', b.energy_type_url AS 'weakness_energy_type_url', 
    c.energy_type_name AS 'resistance_energy_type_name', c.energy_type_url AS 'resistance_energy_type_url', 
    resistance_number, d.energy_type_url AS 'retreat_energy_type_url', retreat_cost, expansion_name, total_cards, 
    expansion_url, release_date, card_number, rarity_name, market_price, image_url FROM wishlist
    INNER JOIN wishlist_card ON wishlist.wishlist_id = wishlist_card.wishlist_id
    INNER JOIN card ON wishlist_card.card_id = card.card_id
    INNER JOIN energy_type a ON card.energy_type_id = a.energy_type_id
    INNER JOIN stage ON card.stage_id = stage.stage_id
    INNER JOIN energy_type b ON card.weakness_energy_type_id = b.energy_type_id
    INNER JOIN energy_type c ON card.resistance_energy_type_id = c.energy_type_id
    INNER JOIN energy_type d ON card.retreat_energy_type_id = d.energy_type_id
    INNER JOIN expansion ON card.expansion_id = expansion.expansion_id
    INNER JOIN rarity ON card.rarity_id = rarity.rarity_id
    ${whereClause}
    ${orderByClause}`;

    //execute queries for cards, collections & filters
    connection.query(wishlistCardsSqlQuery, (err, rows) => {
        if (err) throw err;

        connection.query(myCollectionsQuery, [memberid], (err, myCollections) => {
            if (err) throw err;

            connection.query(hpQuery, (err, hp) => {
                if (err) throw err;

                connection.query(energyTypeQuery, (err, energyTypes) => {
                    if (err) throw err;

                    connection.query(stageQuery, (err, stages) => {
                        if (err) throw err;

                        connection.query(retreatCostQuery, (err, retreatCosts) => {
                            if (err) throw err;

                            connection.query(expansionQuery, (err, expansions) => {
                                if (err) throw err;

                                connection.query(rarityQuery, (err, rarities) => {
                                    if (err) throw err;

                                    connection.query(marketPriceQuery, (err, marketPrices) => {
                                        if (err) throw err;

                                        res.render('wishlist', {
                                            req: req, rowdata: rows, hp: hp, energyTypes: energyTypes,
                                            stages: stages, retreatCosts: retreatCosts, expansions: expansions,
                                            rarities: rarities, marketPrices: marketPrices,
                                            myCollections: myCollections, isAuthenticated: req.session.authen,
                                            displayName: req.session.displayName
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

//set up a route handler for HTTP POST requests to the "/wishlist" endpoint
router.post('/wishlist', (req, res) => {

    const memberid = req.session.memberid;
    const memberCollectionId = req.body.member_collection_id;
    const cardId = req.body.card_id;
    const expansionId = req.body.expansion_id;
    const redirectPage = req.query.redirect;

    //get the wishlist_id associated with the member_id
    const checkWishlistId = `SELECT wishlist_id FROM wishlist 
    WHERE member_id = ${memberid}`;

    connection.query(checkWishlistId, (err, rows) => {
        if (err) throw err;
        const wishlistId = rows[0]['wishlist_id'];

        //insert wishlist_id and card_id into the wishlist_card table
        const addCardToWishlistSql = `INSERT INTO wishlist_card (wishlist_id, card_id) VALUES( ? , ? );`;

        connection.query(addCardToWishlistSql, [wishlistId, cardId], (err, rows) => {
            if (err) throw err;

            //this needs fixed to take into account sort/filter/search for browse, collection & wishlist
            if (redirectPage === 'browse') {
                res.redirect('/browse');
            } else if (redirectPage === 'collection') {
                res.redirect(`/collection?member_collection_id=${memberCollectionId}`);
            } else if (redirectPage === 'card') {
                res.redirect(`/card?card_id=${cardId}`);
            } else if (redirectPage === 'wishlist') {
                res.redirect('/wishlist');
            } else if (redirectPage === 'expansion') {
                res.redirect(`/expansion?expansion_id=${expansionId}`);
            }

        });
    });
});

//set up a route handler for HTTP DELETE requests to the "/wishlist" endpoint
router.delete('/wishlist/:cardId', (req, res) => {

    const memberid = req.session.memberid;
    const memberCollectionId = req.body.member_collection_id;
    const cardId = req.params.cardId;
    const expansionId = req.body.expansion_id;
    const redirectPage = req.query.redirect;

    // sql query to remove the card from the wishlist table
    const removeFromWishlistSql = `DELETE FROM wishlist_card WHERE wishlist_id IN (SELECT wishlist_id FROM wishlist WHERE member_id = ?) AND card_id = ?`;

    connection.query(removeFromWishlistSql, [memberid, cardId], (err, result) => {
        if (err) throw err;

        let redirectString;

        if (redirectPage === 'browse') {
            redirectString = `/browse`;
        } else if (redirectPage === 'collection') {
            redirectString = `/collection?member_collection_id=${memberCollectionId}`;
        } else if (redirectPage === 'card') {
            redirectString = `/card?card_id=${cardId}`;
        } else if (redirectPage === 'wishlist') {
            redirectString = `/wishlist`;
        } else if (redirectPage === 'expansion') {
            redirectString = `/expansion?expansion_id=${expansionId}`;
        }

        res.redirect(redirectString);
    });
});

//export the instance
module.exports = router;