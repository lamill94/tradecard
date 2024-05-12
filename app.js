//import modules
require('dotenv').config();
const express = require("express");
const cookieParser = require('cookie-parser');
const sessions = require('express-session');

//import routes
const routes = [
    require('./routes/homeRoute'),
    require('./routes/browseRoute'),
    require('./routes/cardRoute'),
    require('./routes/loginRoute'),
    require('./routes/signupRoute'),
    require('./routes/logoutRoute'),
    require('./routes/accountRoute'),
    require('./routes/collectionsRoute'),
    require('./routes/collectionRoute'),
    require('./routes/wishlistRoute'),
    require('./routes/expansionsRoute'),
    require('./routes/expansionRoute')
];

//create instance of the express application
const app = express();

//set ejs as the Express app view engine (looks in views by default)
app.set('view engine', 'ejs');

//middleware - tells Express to serve static files from the "public" directory
app.use(express.static(__dirname + "/public"));

//middleware - configure Express to parse incoming request bodies (get/post) encoded in URL-encoded format
app.use(express.urlencoded({ extended: true }));

//set exp time for session cookie (one hour in milliseconds)
const oneHour = 1000 * 60 * 60 * 1;

//middleware - parse cookies in incoming requests
app.use(cookieParser());

//middleware - config session data
app.use(sessions({
    secret: "mySession",
    saveUninitialized: true,
    cookie: { maxAge: oneHour },
    resave: false
}));

//mount routers onto Express application
mountRoutes();

//start the server and make it listen for incoming HTTP requests on port 3000
app.listen(3000, (err) => {
    if (err) throw err;
    console.log(`Server is listening on localhost:3000`)
});

//function to mount routers onto Express application
function mountRoutes() {
    routes.forEach(route => {
        app.use(route);
    });
}