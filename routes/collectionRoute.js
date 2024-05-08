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

const wishlistQuery = `SELECT * FROM wishlist 
INNER JOIN wishlist_card ON wishlist.wishlist_id = wishlist_card.wishlist_id
WHERE member_id = ?`;

const commentsQuery = `SELECT * FROM member_collection 
INNER JOIN collection ON member_collection.collection_id = collection.collection_id
INNER JOIN collection_comment ON collection.collection_id = collection_comment.collection_id
INNER JOIN comment ON collection_comment.comment_id = comment.comment_id
INNER JOIN member ON comment.commenter_id = member.member_id
WHERE member_collection.member_collection_id = ?`;

//set up a route handler for HTTP GET requests to the "/collection" endpoint
router.get("/collection", (req, res) => {

    const memberCollectionId = req.query.member_collection_id;
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
    let whereClause = filterClauses.length > 0 ? `WHERE member_collection_id = ${memberCollectionId} AND ${filterClauses.join(' AND ')}` : `WHERE member_collection_id = ${memberCollectionId}`;

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
    const cardsInCollectionSql = `SELECT member_collection_id, member_collection.member_id AS 'member_id', 
    display_name, collection.collection_id AS 'collection_id', collection_name, card.card_id AS 'card_id', card_name, hp, a.energy_type_name, a.energy_type_url, 
    stage, evolves_from, b.energy_type_name AS 'weakness_energy_type_name', 
    b.energy_type_url AS 'weakness_energy_type_url', c.energy_type_name AS 'resistance_energy_type_name', 
    c.energy_type_url AS 'resistance_energy_type_url', resistance_number, 
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
    ${whereClause}
    ${orderByClause}`;

    //execute queries for cards, collections & filters
    connection.query(cardsInCollectionSql, (err, rows) => {
        if (err) throw err;

        //check if collection is empty
        const isEmptyCollection = rows.length === 0;

        //if collection is empty then nothing is returned so run another query to get 
        //collection details such as collection_name
        if (isEmptyCollection) {

            const readsql = `SELECT * FROM member_collection
                INNER JOIN member ON member_collection.member_id = member.member_id
                INNER JOIN collection ON member_collection.collection_id = collection.collection_id
                WHERE member_collection_id = ?`;

            connection.query(readsql, [memberCollectionId], (err, rows) => {
                if (err) throw err;

                res.render('collection', {
                    rowdata: rows, isEmptyCollection: isEmptyCollection,
                    isAuthenticated: req.session.authen, displayName: req.session.displayName
                });
            });

            //else if collection isn't empty then render as normal
        } else {

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

                                                connection.query(commentsQuery, [memberCollectionId], (err, comments) => {
                                                    if (err) throw err;

                                                    res.render('collection', {
                                                        req: req, rowdata: rows, hp: hp, myCollections: myCollections,
                                                        myWishlist: myWishlist, energyTypes: energyTypes, stages: stages,
                                                        retreatCosts: retreatCosts, expansions: expansions,
                                                        rarities: rarities, marketPrices: marketPrices,
                                                        isEmptyCollection: isEmptyCollection,
                                                        isAuthenticated: req.session.authen,
                                                        displayName: req.session.displayName, comments: comments
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
        }
    });
});

//set up a route handler for HTTP POST requests to the "/collection" endpoint
router.post('/collection', (req, res) => {

    const currentMemberCollectionId = req.body.current_member_collection_id;
    const memberCollectionId = req.body.member_collection_id;
    const cardId = req.body.card_id;
    const expansionId = req.body.expansion_id;
    const redirectPage = req.query.redirect;

    //get the collection_id associated with the member_collection_id
    const checkCollectionId = `SELECT collection_id FROM member_collection 
    WHERE member_collection_id = ${memberCollectionId}`;

    connection.query(checkCollectionId, (err, rows) => {
        if (err) throw err;
        const collectionId = rows[0]['collection_id'];

        //insert collection_id and card_id into the collection_card table
        const addCardToCollectionSql = `INSERT INTO collection_card (collection_id, card_id) VALUES( ? , ? );`;

        connection.query(addCardToCollectionSql, [collectionId, cardId], (err, rows) => {
            if (err) throw err;

            //this needs fixed to take into account sort/filter/search for browse, collection & wishlist
            if (redirectPage === 'browse') {
                res.redirect('/browse');
            } else if (redirectPage === 'collection') {
                res.redirect(`/collection?member_collection_id=${currentMemberCollectionId}`);
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

//set up a route handler for HTTP POST requests to the "/collection/comment" endpoint
router.post('/collection/comment', (req, res) => {

    const memberid = req.session.memberid;
    const collectionId = req.body.collection_id;
    const memberCollectionId = req.body.member_collection_id;
    const rating = req.body.rating;
    const comment = req.body.comment;

    //insert comment & rating into the comment table
    const addCommentSql = `INSERT INTO comment (commentary, rating, commenter_id) VALUES( ? , ? , ? );`;

    connection.query(addCommentSql, [comment, rating, memberid], (err, rows) => {
        if (err) throw err;
        const newCommentId = rows.insertId;

        //then insert new comment_id and collection_id into collection_comment table 
        const addCommentCollectionSql = `INSERT INTO collection_comment (collection_id, comment_id) VALUES ( ? , ? );`;

        connection.query(addCommentCollectionSql, [collectionId, newCommentId], (err, rows) => {
            if (err) throw err;

            res.redirect(`/collection?member_collection_id=${memberCollectionId}`);
        });
    });
});

//set up a route handler for HTTP DELETE requests to the "/collection" endpoint
router.delete('/collection/:cardId', (req, res) => {

    const memberCollectionId = req.query.member_collection_id;
    const cardId = req.params.cardId;

    // sql query to remove the card from the collection table
    const removeFromCollectionSql = `DELETE FROM collection_card WHERE collection_id IN (SELECT collection_id FROM member_collection WHERE member_collection_id = ?) AND card_id = ?`;

    connection.query(removeFromCollectionSql, [memberCollectionId, cardId], (err, result) => {
        if (err) throw err;

        res.redirect(`/collection?member_collection_id=${memberCollectionId}`);
    });
});

//export the instance
module.exports = router;