import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql";
import { createHash } from "crypto";
import nodemailer from "nodemailer";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;
var isLoggedin = false;
var signUp = 0;
var correct = true;
let nameLoggedIn = "";
var email = "";
var infoRecorded = 0;


const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "info"
});

conn.connect((err) => {
    if (err) console.log("Error connecting to database: " + err.stack);
    else console.log("Database Connected. ID: " + conn.threadId);
});

function hash(input) {
    return createHash('sha256').update(input).digest('hex');
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/place_photos', express.static(__dirname + "/public/category_pages/place_photos"));
app.use('/public', express.static(__dirname + "/public"));
app.use('/views', express.static(__dirname + "/views"));
app.use('/fonts', express.static(__dirname + "/fonts"));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/main.html');
});

app.get('/signup.ejs', (req, res) => {
    res.render(__dirname + "/signup.ejs", { signUp });
});

app.get('/login.html', (req, res) => {
    res.render(__dirname + '/login.ejs', { correct });
});

app.get('/events', (req, res) => {
    res.render(__dirname + "/navpages/events.ejs");
})

app.get('/form', (req, res) => {
    res.sendFile(__dirname + '/views/form.html')
})

app.get('/category/:name', (req, res) => {
    let name = req.params.name;
    res.sendFile(__dirname + '/public/category_pages/' + name + '.html');
})

app.get('/category/:name/:id', (req, res) => {
    let id = req.params.id;
    let name = req.params.name;

    let query = "SELECT * from " + name + " where place_id=" + id;
    conn.query(query, (err, results) => {
        if (err) {
            console.log(err); 
            res.send('Error using the database');
            return;
        }
        if(results.length > 0) {
            let placename = results[0].Name;
            let diff = results[0].difficultylevel;
            let desc = results[0].Description;
            let history = results[0].History;
            let bannerPath = results[0].banner;
            let map = results[0].map;
            res.render(__dirname + '/public/category_pages/infopage.ejs', { placename, diff, desc, history, bannerPath, map });
        }
    })
})

app.post("/login", (req, res) => {
    let email = req.body.email;
    let pass = req.body.pass;

    let query = "SELECT * from user where email = ? and password = ?";
    conn.query(query, [email, pass], (err, results) => {
        if (err) {
            res.status(500).send('Error retrieving user from database');
            return;
        }
        if (results.length > 0) {
            nameLoggedIn = results[0].firstname;
            console.log(nameLoggedIn);
            res.redirect('/addinfo');
            isLoggedin = true;
        }
        else {
            correct = false;
            res.render(__dirname + "/login.ejs", { correct });
        }
    });
});

app.get('/adminpage', (req, res) => {

});

app.get('/addinfo', (req, res) => {
    res.render(__dirname + "/views/form.ejs", { nameLoggedIn, infoRecorded });
});

app.post('/signup', (req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let pass = req.body.pass;
    let user = req.body.user;
    let mob = req.body.mobno;

    console.log(firstname + " " + lastname);

    const query2 = "insert into user (firstname, lastname, email, password, usertype, mobile_no) VALUES (?, ?, ?, ?, ?, ?)";
    conn.query(query2, [firstname, lastname, email, pass, user, mob], (err, results) => {
        if (err) {
            console.log(err);
            signUp = 2;
            res.render(__dirname + '/signup.ejs', { signUp });
            return;
        }
        signUp = 1;
        res.render(__dirname + '/signup.ejs', { signUp });
    });
});

app.post('/getinfo', (req, res) => {
    let name = req.body.name;
    let cat = req.body.category;
    let org_desc = req.body.description;
    let desc = org_desc.replace(/\n/g, "\n\n");
    let org_history = req.body.history;
    let history = org_history.replace(/\n/g, "\n\n");
    let map = req.body.map;

    let query = "insert into " + cat + " (Name, description, history, map) values (?, ?, ?, ?)"
    conn.query(query, [name, desc, history, map], (err, results) => {
        if (err) {
            infoRecorded = 2;
            console.log(err);
            res.render(__dirname + '/views/form.ejs', { nameLoggedIn, infoRecorded });
            return;
        }
        infoRecorded = 1;
        res.render(__dirname + '/views/form.ejs', { nameLoggedIn, infoRecorded });
    })
})

app.listen(port, () => {
    console.log(`Server's now runnning on port ${port}`);
});