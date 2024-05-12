//add router instance
const router = require("express").Router();

//set up a route handler for HTTP GET requests to the "/logout" endpoint
router.get("/logout", (req, res) => {

    req.session.destroy(err => {
        if (err) throw err;
        res.redirect("/");
    });
});

//export the router
module.exports = router;