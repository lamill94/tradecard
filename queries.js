//import modules
const connection = require("./connection");

//SQL queries for user's collections (including comments), wishlist and filters
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
module.exports = { sqlQueries, executeQuery };