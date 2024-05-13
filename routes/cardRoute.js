//import modules
const router = require("express").Router();
const { sqlQueries, executeQuery } = require("../queries");

//set up a route handler for HTTP GET requests to the "/card" endpoint
router.get("/card", async (req, res) => {

    const cardId = req.query.card_id;
    const memberid = req.session.memberid;

    const cardData = await executeQuery(sqlQueries.cardDetailsQuery, [cardId]);
    const myCollections = await executeQuery(sqlQueries.myCollectionsQuery, [memberid]);
    const myWishlist = await executeQuery(sqlQueries.wishlistQuery, [memberid]);

    res.render('card', {
        cardData: cardData, myCollections: myCollections, myWishlist: myWishlist,
        isAuthenticated: req.session.authen, displayName: req.session.displayName
    });
});

//export the router
module.exports = router;