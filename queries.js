//import modules
const connection = require("./connection");

//sql queries for user's collections, collection comments, user's wishlist and filters

const sqlQueries = {

    myCollectionsQuery: `SELECT * FROM member_collection 
    INNER JOIN collection ON member_collection.collection_id = collection.collection_id
    INNER JOIN member ON member_collection.member_id = member.member_id
    WHERE member_collection.member_id = ?`,

    commentsQuery: `SELECT * FROM member_collection 
    INNER JOIN collection ON member_collection.collection_id = collection.collection_id
    INNER JOIN collection_comment ON collection.collection_id = collection_comment.collection_id
    INNER JOIN comment ON collection_comment.comment_id = comment.comment_id
    INNER JOIN member ON comment.commenter_id = member.member_id
    WHERE member_collection.member_collection_id = ?`,

    wishlistQuery: `SELECT * FROM wishlist 
    INNER JOIN wishlist_card ON wishlist.wishlist_id = wishlist_card.wishlist_id
    WHERE member_id = ?`,

    hpQuery: `SELECT MIN(hp) AS 'min_hp', MAX(hp) AS 'max_hp' FROM card`,

    energyTypeQuery: `SELECT * FROM energy_type WHERE energy_type_id != 1`,

    stageQuery: `SELECT * FROM stage`,

    retreatCostQuery: `SELECT * FROM retreat_cost`,

    expansionQuery: `SELECT * FROM expansion`,

    rarityQuery: `SELECT * FROM rarity`,

    marketPriceQuery: `SELECT MIN(market_price) AS 'min_market_price', MAX(market_price) AS 'max_market_price' FROM card`
};

//function to generate filter clauses
function generateFilterClauses(filters) {

    const { minHpFilter, maxHpFilter, energyTypeFilter, stageFilter, weaknessEnergyTypeFilter,
        resistanceEnergyTypeFilter, retreatCostFilter, expansionFilter, rarityFilter, minMarketPriceFilter,
        maxMarketPriceFilter, search } = filters;

    //push filter clauses & search to the filterClauses array
    const filterClauses = [];

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

    return filterClauses;
}

//common function to generate WHERE clause
function generateWhereClause(filterClauses) {
    return filterClauses.length > 0 ? `WHERE ${filterClauses.join(' AND ')}` : '';
}

//function to generate the ORDER BY clause
function generateOrderByClause(sort) {
    return sort ? (Array.isArray(sort) ? `ORDER BY ${sort[0]}, ${sort[1]}` : `ORDER BY ${sort}`) : `ORDER BY release_date, card_number`;
}

//function for browse view
function generateAllCardsQuery(filters) {

    //combine all filter clauses into a single WHERE clause
    let whereClause = generateWhereClause(generateFilterClauses(filters));

    //set orderByClause
    let orderByClause = generateOrderByClause(filters.sort);

    //query to render the cards including whereClause & orderByClause
    const allCardsQuery = `SELECT card_id, card_name, hp, a.energy_type_name AS 'energy_type_name', 
        a.energy_type_url AS 'energy_type_url', stage, evolves_from, b.energy_type_name AS 'weakness_energy_type_name', 
        b.energy_type_url AS 'weakness_energy_type_url', c.energy_type_name AS 'resistance_energy_type_name', 
        c.energy_type_url AS 'resistance_energy_type_url', resistance_number, 
        d.energy_type_url AS 'retreat_energy_type_url', retreat_cost, expansion_name, total_cards, expansion_url, 
        release_date, card_number, rarity_name, market_price, image_url FROM card 
        INNER JOIN energy_type a ON card.energy_type_id = a.energy_type_id
        INNER JOIN stage ON card.stage_id = stage.stage_id
        INNER JOIN energy_type b ON card.weakness_energy_type_id = b.energy_type_id
        INNER JOIN energy_type c ON card.resistance_energy_type_id = c.energy_type_id
        INNER JOIN energy_type d ON card.retreat_energy_type_id = d.energy_type_id
        INNER JOIN expansion ON card.expansion_id = expansion.expansion_id
        INNER JOIN rarity ON card.rarity_id = rarity.rarity_id
        ${whereClause}
        ${orderByClause}`;

    return allCardsQuery;
};

//function for expansion view
function generateCardsInExpansionQuery(filters) {

    //combine all filter clauses into a single WHERE clause
    let filterClauses = generateFilterClauses(filters);
    filterClauses.push(`expansion.expansion_id = ${filters.expansionId}`);

    let whereClause = generateWhereClause(filterClauses);

    //set orderByClause
    let orderByClause = generateOrderByClause(filters.sort);

    //query to render the cards including whereClause & orderByClause
    const cardsInExpansionQuery = `SELECT card_id, card_name, hp, a.energy_type_name AS 'energy_type_name', 
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

    return cardsInExpansionQuery;
};

//function for collection view
function generateCardsInCollectionQuery(filters) {

    //combine all filter clauses into a single WHERE clause
    let filterClauses = generateFilterClauses(filters);
    filterClauses.push(`member_collection_id = ${filters.memberCollectionId}`);

    let whereClause = generateWhereClause(filterClauses);

    //set orderByClause
    let orderByClause = generateOrderByClause(filters.sort);

    //query to render the cards including whereClause & orderByClause
    const cardsInCollectionQuery = `SELECT member_collection_id, member_collection.member_id AS 'member_id', 
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

    return cardsInCollectionQuery;
};

//function for wishlist view
function generateCardsInWishlistQuery(filters) {

    //combine all filter clauses into a single WHERE clause
    let filterClauses = generateFilterClauses(filters);
    filterClauses.push(`member_id = ${filters.memberid}`);

    let whereClause = generateWhereClause(filterClauses);

    //set orderByClause
    let orderByClause = generateOrderByClause(filters.sort);

    //query to render the cards including whereClause & orderByClause
    const cardsInWishlistQuery = `SELECT member_id, card.card_id AS 'card_id', card_name, hp, 
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

    return cardsInWishlistQuery;
};

//function to execute query
function executeQuery(sqlQuery, params) {
    return new Promise((resolve, reject) => {
        connection.query(sqlQuery, params, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
};

//export the queries & the query function
module.exports = {
    sqlQueries, generateAllCardsQuery, generateCardsInExpansionQuery, generateCardsInCollectionQuery,
    generateCardsInWishlistQuery, executeQuery
};