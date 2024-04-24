//add router instance
const router = require("express").Router();

//set up a route handler for HTTP GET requests to the root URL
router.get("/", (req, res) => {
    res.render('home', { isAuthenticated: req.session.authen, displayName: req.session.displayName });
});

//export the instance
module.exports = router;