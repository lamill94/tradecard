//import modules
const router = require("express").Router();
const connection = require("../connection");

//set up a route handler for HTTP GET requests to the "/expansions" endpoint
router.get("/expansions", (req, res) => {

    //sql query to get all series names
    const seriesQuery = `SELECT * FROM series`;

    connection.query(seriesQuery, (err, series) => {
        if (err) throw err;

        //sql query to get all expansion details under each series name
        const seriesExpansionsQuery = `SELECT * FROM series_expansion
        INNER JOIN series ON series_expansion.series_id = series.series_id
        INNER JOIN expansion ON series_expansion.expansion_id = expansion.expansion_id`;

        connection.query(seriesExpansionsQuery, (err, expansions) => {
            if (err) throw err;

            res.render('expansions', {
                series: series, expansions: expansions, isAuthenticated: req.session.authen,
                displayName: req.session.displayName
            });
        });
    });
});

//export the router
module.exports = router;