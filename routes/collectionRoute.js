//import modules
const router = require("express").Router();
const connection = require("../connection");
const { sqlQueries, generateCardsInCollectionQuery, executeQuery } = require("../queries");

//set up a route handler for HTTP GET requests to the "/collection" endpoint
router.get("/collection", async (req, res) => {

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
    const cardsInCollectionQuery = generateCardsInCollectionQuery({
        minHpFilter, maxHpFilter, energyTypeFilter, stageFilter,
        weaknessEnergyTypeFilter, resistanceEnergyTypeFilter, retreatCostFilter, expansionFilter, rarityFilter,
        minMarketPriceFilter, maxMarketPriceFilter, sort, search, memberCollectionId
    });

    //execute queries
    const cards = await executeQuery(cardsInCollectionQuery);

    //check if there are no cards in collection
    const isEmptyCollection = cards.length === 0;

    //if collection is empty then nothing is returned so run another query to get collection details such as collection_name
    if (isEmptyCollection) {

        const emptyCollectionsql = `SELECT * FROM member_collection
                INNER JOIN member ON member_collection.member_id = member.member_id
                INNER JOIN collection ON member_collection.collection_id = collection.collection_id
                WHERE member_collection_id = ?`;

        connection.query(emptyCollectionsql, [memberCollectionId], (err, cards) => {
            if (err) throw err;

            res.render('collection', {
                cards: cards, isEmptyCollection: isEmptyCollection,
                isAuthenticated: req.session.authen, displayName: req.session.displayName
            });
        });

        //else if collection isn't empty then render as normal
    } else {

        const myCollections = await executeQuery(sqlQueries.myCollectionsQuery, [memberid]);
        const myWishlist = await executeQuery(sqlQueries.wishlistQuery, [memberid]);
        const hp = await executeQuery(sqlQueries.hpQuery, []);
        const energyTypes = await executeQuery(sqlQueries.energyTypeQuery, []);
        const stages = await executeQuery(sqlQueries.stageQuery, []);
        const retreatCosts = await executeQuery(sqlQueries.retreatCostQuery, []);
        const expansions = await executeQuery(sqlQueries.expansionQuery, []);
        const rarities = await executeQuery(sqlQueries.rarityQuery, []);
        const marketPrices = await executeQuery(sqlQueries.marketPriceQuery, []);
        const comments = await executeQuery(sqlQueries.commentsQuery, [memberCollectionId]);

        res.render('collection', {
            req: req, cards: cards, hp: hp, myCollections: myCollections, myWishlist: myWishlist,
            energyTypes: energyTypes, stages: stages, retreatCosts: retreatCosts, expansions: expansions,
            rarities: rarities, marketPrices: marketPrices, isEmptyCollection: isEmptyCollection,
            isAuthenticated: req.session.authen, displayName: req.session.displayName, comments: comments
        });
    }
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

    //if rating isn't populated then show empty rating notification
    if (!rating) {

        res.redirect(`/collection?member_collection_id=${memberCollectionId}&rating_missing=true`);

        //else if rating is populated
    } else {

        //check if user has already left rating/comment
        const checkuser = `SELECT * FROM collection_comment
        INNER JOIN comment ON collection_comment.comment_id = comment.comment_id
        WHERE collection_id = ${collectionId} AND commenter_id = ${memberid}`;

        connection.query(checkuser, (err, rows) => {
            if (err) throw err;
            const numRows = rows.length;

            //if user has already left rating/comment then redirect with notification
            if (numRows > 0) {
                res.redirect(`/collection?member_collection_id=${memberCollectionId}&already_commented=true`);

                //else if user hasn't left rating/comment
            } else {

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
            }
        });
    }
});

//set up a route handler for HTTP DELETE requests to the "/collection/:cardId" endpoint
router.post('/collection/:cardId', (req, res) => {

    const memberCollectionId = req.query.member_collection_id;
    const cardId = req.params.cardId;

    // sql query to remove the card from the collection table
    const removeFromCollectionSql = `DELETE FROM collection_card WHERE collection_id IN (SELECT collection_id FROM member_collection WHERE member_collection_id = ?) AND card_id = ?`;

    connection.query(removeFromCollectionSql, [memberCollectionId, cardId], (err, result) => {
        if (err) throw err;

        res.redirect(`/collection?member_collection_id=${memberCollectionId}`);
    });
});

//set up a route handler for HTTP DELETE requests to the "/collection/deleteComment" endpoint
router.post('/collection/comment/:collectionCommentId', (req, res) => {

    const memberCollectionId = req.query.member_collection_id;
    const collectionCommentId = req.params.collectionCommentId

    // sql query to remove comment from the collection_comment table
    const removeCommentQuery = `DELETE FROM collection_comment WHERE collection_comment_id = ?`;

    connection.query(removeCommentQuery, [collectionCommentId], (err, result) => {
        if (err) throw err;

        res.redirect(`/collection?member_collection_id=${memberCollectionId}`);
    });
});

//export the router
module.exports = router;