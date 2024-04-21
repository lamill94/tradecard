//import Express.js framework
const express = require("express");

//create instance of the express application
const app = express();

//middleware - tells Express to serve static files from the "public" directory
app.use(express.static(__dirname + "/public"));

//set ejs as the Express app view engine (looks in views by default)
app.set('view engine', 'ejs');

//set references to the routes instances
const homeRoute = require('./routes/homeRoute');
const browseRoute = require('./routes/browseRoute');
const cardRoute = require('./routes/cardRoute');

//configure Express to parse incoming request bodies encoded in URL-encoded format
app.use(express.urlencoded({ extended: true }));

//mount routers onto Express application
app.use(homeRoute);
app.use(browseRoute);
app.use(cardRoute);

//start the server and make it listen for incoming HTTP requests on port 3000
app.listen(3000, (err) => {
    if (err) throw err;
    console.log(`Server is listening on localhost:3000`)
});