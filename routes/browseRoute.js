//import modules
const router = require("express").Router();
const { sqlQueries, generateAllCardsQuery, executeQuery } = require("../queries");

//set up a route handler for HTTP GET requests to the "/browse" endpoint
router.get("/browse", async (req, res) => {

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
    const allCardsQuery = generateAllCardsQuery({
        minHpFilter, maxHpFilter, energyTypeFilter, stageFilter,
        weaknessEnergyTypeFilter, resistanceEnergyTypeFilter, retreatCostFilter, expansionFilter, rarityFilter,
        minMarketPriceFilter, maxMarketPriceFilter, sort, search
    });

    //execute queries
    const cards = await executeQuery(allCardsQuery);
    const myCollections = await executeQuery(sqlQueries.myCollectionsQuery, [memberid]);
    const myWishlist = await executeQuery(sqlQueries.wishlistQuery, [memberid]);
    const hp = await executeQuery(sqlQueries.hpQuery, []);
    const energyTypes = await executeQuery(sqlQueries.energyTypeQuery, []);
    const stages = await executeQuery(sqlQueries.stageQuery, []);
    const retreatCosts = await executeQuery(sqlQueries.retreatCostQuery, []);
    const expansions = await executeQuery(sqlQueries.expansionQuery, []);
    const rarities = await executeQuery(sqlQueries.rarityQuery, []);
    const marketPrices = await executeQuery(sqlQueries.marketPriceQuery, []);

    //render the browse page
    res.render('browse', {
        req: req, cards: cards, myCollections: myCollections, myWishlist: myWishlist, hp: hp,
        energyTypes: energyTypes, stages: stages, retreatCosts: retreatCosts, expansions: expansions,
        rarities: rarities, marketPrices: marketPrices, isAuthenticated: req.session.authen,
        displayName: req.session.displayName
    });
});

//export the router
module.exports = router;