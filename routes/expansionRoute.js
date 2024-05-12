//import modules
const router = require("express").Router();
const connection = require("../connection");

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

const wishlistQuery = `SELECT * FROM wishlist 
INNER JOIN wishlist_card ON wishlist.wishlist_id = wishlist_card.wishlist_id
WHERE member_id = ?`;

//set up a route handler for HTTP GET requests to the "/expansion" endpoint
router.get("/expansion", (req, res) => {

    const expansionId = req.query.expansion_id;
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
    let whereClause = filterClauses.length > 0 ? `WHERE expansion.expansion_id = ${expansionId} AND ${filterClauses.join(' AND ')}` : `WHERE expansion.expansion_id = ${expansionId}`;

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
    const cardsInExpansionSql = `SELECT card_id, card_name, hp, a.energy_type_name AS 'energy_type_name', 
    a.energy_type_url AS 'energy_type_url', stage, evolves_from, b.energy_type_name AS 'weakness_energy_type_name', 
    b.energy_type_url AS 'weakness_energy_type_url', c.energy_type_name AS 'resistance_energy_type_name', 
    c.energy_type_url AS 'resistance_energy_type_url', resistance_number, 
    d.energy_type_url AS 'retreat_energy_type_url', retreat_cost, expansion.expansion_id AS 'expansion_id', 
    expansion_name, total_cards, expansion_url, release_date, card_number, rarity_name, market_price, 
    image_url FROM card 
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
    connection.query(cardsInExpansionSql, (err, rows) => {
        if (err) throw err;

        connection.query(myCollectionsQuery, [memberid], (err, myCollections) => {
            if (err) throw err;

            connection.query(wishlistQuery, [memberid], (err, myWishlist) => {
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

                                            res.render('expansion', {
                                                req: req, rowdata: rows, hp: hp, myCollections: myCollections,
                                                myWishlist: myWishlist, energyTypes: energyTypes, stages: stages,
                                                retreatCosts: retreatCosts, expansions: expansions,
                                                rarities: rarities, marketPrices: marketPrices,
                                                isAuthenticated: req.session.authen,
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
});

//export the instance
module.exports = router;