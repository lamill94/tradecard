//import modules
const router = require("express").Router();
const connection = require("../connection");
const { sqlQueries, generateCardsInWishlistQuery, executeQuery } = require("../queries");

//set up a route handler for HTTP GET requests to the "/wishlist" endpoint
router.get("/wishlist", async (req, res) => {

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
    const cardsInWishlistQuery = generateCardsInWishlistQuery({
        minHpFilter, maxHpFilter, energyTypeFilter, stageFilter,
        weaknessEnergyTypeFilter, resistanceEnergyTypeFilter, retreatCostFilter, expansionFilter, rarityFilter,
        minMarketPriceFilter, maxMarketPriceFilter, sort, search, memberid
    });

    //execute queries
    const cards = await executeQuery(cardsInWishlistQuery);
    const myCollections = await executeQuery(sqlQueries.myCollectionsQuery, [memberid]);
    const hp = await executeQuery(sqlQueries.hpQuery, []);
    const energyTypes = await executeQuery(sqlQueries.energyTypeQuery, []);
    const stages = await executeQuery(sqlQueries.stageQuery, []);
    const retreatCosts = await executeQuery(sqlQueries.retreatCostQuery, []);
    const expansions = await executeQuery(sqlQueries.expansionQuery, []);
    const rarities = await executeQuery(sqlQueries.rarityQuery, []);
    const marketPrices = await executeQuery(sqlQueries.marketPriceQuery, []);

    res.render('wishlist', {
        req: req, cards: cards, hp: hp, energyTypes: energyTypes, stages: stages, retreatCosts: retreatCosts,
        expansions: expansions, rarities: rarities, marketPrices: marketPrices, myCollections: myCollections,
        isAuthenticated: req.session.authen, displayName: req.session.displayName
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

//export the router
module.exports = router;