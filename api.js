// Import express
const express = require('express');

// Import Body parser
const bodyParser = require('body-parser');

//import fs
const fs = require("fs");

//import passport
const jwt = require("jsonwebtoken");

//import crypto
const crypto = require("crypto");

// Initialise the app 
const app = express();

console.log("Your app is listening on port "
            + app.listen(process.env.PORT, () => {})
            .address().port);


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


app.get('/', (req, resp) => {
    resp.status(200).send('Coronavirus data in Italy');
});

app.post('/account', (req, resp) => {
    var username = req.body.name;

    var myPath = ".DB/".concat(username, ".json");
    if(fs.existsSync(myPath)) {
        return resp.status(400)
                    .json( {error: "username already in use"})
                    .end();
    }

    if(!fs.existsSync(".DB")){
        fs.mkdirSync(".DB");
    }

    var salt = crypto.randomBytes(16).toString('hex'); 
    
    // Hashing user's salt and password with 1000 iterations, 64 length and sha512 digest 
    var hash = crypto.pbkdf2Sync(req.headers.password, salt, 1000, 64, `sha512`).toString(`hex`); 

    var info = { password: hash,
                salt: salt}

    var myFile = JSON.stringify(info);

    fs.writeFileSync(myPath, myFile);

    return resp.status(201)
                .json({ message: username
                .concat(" added!!")})
                .end();
    
});    

app.get('/account/:name', (req, resp) => {

    var username = req.params.name;
    var myPath = ".DB/".concat(username, ".json");
    if(!fs.existsSync(myPath)) {
        return resp.status(404)
                .json({ error: "username not found"})
                .end();
    }
    var db = JSON.parse(fs.readFileSync(myPath));    
    var hash = db.password;
    var salt = db.salt;
    var JWT = crypto.randomBytes(16).toString('hex');

    var hash2 = crypto.pbkdf2Sync(req.headers.password, salt, 1000, 64, `sha512`).toString(`hex`); 
    if(hash == hash2){ 
        var token = jwt.sign({ username }, JWT, {
            expiresIn: 8000
        });

        var info = { password: hash,
                    salt: salt,
                    JWT: JWT}

        var myFile = JSON.stringify(info);

        fs.writeFileSync(myPath, myFile);

        resp.setHeader("Token" , token);
        return resp.status(200)
                    .json({ message: "login successful"})
                    .end();
    }
    return resp.status(401)
                .json({ error: "passwords not matching" })
                .end(); 
});
