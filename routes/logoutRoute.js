//add router instance
const router = require("express").Router();

//set up a route handler for HTTP GET requests to the "/logout" endpoint
router.get("/logout", (req, res) => {

    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
        } else {
            res.redirect("/");
        }
    });
});

//export the instance
module.exports = router;