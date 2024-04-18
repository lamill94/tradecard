//import Express.js framework
const express = require("express");

//create instance of the express application
const app = express();

//import the built-in Node.js module "path"
//const path = require("path");

//middleware - tells Express to serve static files from the "public" directory
//app.use(express.static(path.join(__dirname, './public')));

//or could just do below not using path?
//app.use(express.static(__dirname + "/public"));

//import the "mysql2" module
const mysql = require("mysql2");

//set ejs as the Express app view engine (looks in views by default)
app.set('view engine', 'ejs');

//configure Express to parse incoming request bodies encoded in URL-encoded format
app.use(express.urlencoded({ extended: true }));

//create mysql connection object
const connection = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: '40108404',
        port: '3306',
    }
);

//establish connection to mysql database
connection.connect((err) => {
    if (err) {
        return console.log(err.message)
    } else {
        return console.log(`Connection to local MySQL DB.`)
    };
});

//set up a route handler for HTTP GET requests to the root URL
app.get("/", (req, res) => {
    res.render('home');
});

//explain below...
app.get("/browse", (req, res) => {
    const readsql = `SELECT * FROM card`;

    connection.query(readsql, (err, rows) => {
        if (err) throw err;
        res.render('browse', { title: 'Cards', rowdata: rows });
    });
});

//start the server and make it listen for incoming HTTP requests on port 3000
app.listen(3000, (err) => {
    if (err) throw err;
    console.log(`Server is listening on localhost:3000`)
});