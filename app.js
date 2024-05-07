//import Express.js framework, cookie-parser package (to parse cookies in incoming requests) & express-session
//package (to manage session data in express.js applications)
const express = require("express");
const cookieParser = require('cookie-parser');
const sessions = require('express-session');

//set references to the routes instances
const homeRoute = require('./routes/homeRoute');
const browseRoute = require('./routes/browseRoute');
const cardRoute = require('./routes/cardRoute');
const loginRoute = require('./routes/loginRoute');
const signupRoute = require('./routes/signupRoute');
const logoutRoute = require('./routes/logoutRoute');
const accountRoute = require('./routes/accountRoute');
const collectionsRoute = require('./routes/collectionsRoute');
const collectionRoute = require('./routes/collectionRoute');
const wishlistRoute = require('./routes/wishlistRoute');
const expansionsRoute = require('./routes/expansionsRoute');
const expansionRoute = require('./routes/expansionRoute');

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
app.use(homeRoute);
app.use(browseRoute);
app.use(cardRoute);
app.use(loginRoute);
app.use(signupRoute);
app.use(logoutRoute);
app.use(accountRoute);
app.use(collectionsRoute);
app.use(collectionRoute);
app.use(wishlistRoute);
app.use(expansionsRoute);
app.use(expansionRoute);

//start the server and make it listen for incoming HTTP requests on port 3000
app.listen(3000, (err) => {
    if (err) throw err;
    console.log(`Server is listening on localhost:3000`)
});