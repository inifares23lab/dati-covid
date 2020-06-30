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

app.patch('/account/:name', (req, resp) => {
    var action = req.body.action;
    var username = req.params.name;
    var myPath = ".DB/".concat(username, ".json");

    if(!fs.existsSync(myPath)) {
        return resp.status(404)
                    .json( { error: "user not found" })
                    .end();
    }
        
    var me = JSON.parse(fs.readFileSync(myPath));
    var JWT = me.JWT; 
    
    var token = req.headers.token;

    if (!token) {
        return resp.status(412)
                    .json({ error: "No token provided!" })
                    .end();
    }

    jwt.verify(token, JWT, async (err) => {
        if (err) {
            return resp.status(401)
                        .json({ error: "Unauthorized!" })
                        .end();
        }
        
        var salt = crypto.randomBytes(16).toString('hex'); 

        // Hashing user's salt and password with 1000 iterations, 64 length and sha512 digest 
        var hash = crypto.pbkdf2Sync(req.headers.password, salt, 1000, 64, `sha512`).toString(`hex`); 

        
        me.password = hash;
        me.salt = salt;
        me.JWT = JWT;
        var myfile = JSON.stringify(me);
        fs.writeFileSync(myPath, myfile);

        return resp.status(200)
                    .json({ message: action
                            .concat(" for user '"
                            .concat(username
                            .concat("' successful!!")))})
                            .end();
    });
});

app.put('/account/:name', (req, resp) => {
    var action = req.body.action;
    var username = req.params.name;
    var myPath = ".DB/".concat(username, ".json");

    if(!fs.existsSync(myPath)) {
        return resp.status(404)
                    .json( { error: "user not found"})
                    .end();
    }    
    var me = JSON.parse(fs.readFileSync(myPath));
    var JWT = me.JWT; 
    var hash = me.password;
    var salt = me.salt;
    
    var token = req.headers.token;

    if (!token) {
        return resp.status(412)
                    .json({ error : "No token provided!" })
                    .end();
    }

    jwt.verify(token, JWT, async (err) => {
        if (err) {
            return resp.status(401)
                        .json({ error: "you are not logged in!"})
                        .end();
        }

        var info = { password: hash,
                    salt: salt}

        var myFile = JSON.stringify(info);

        fs.writeFileSync(myPath, myFile);

        return resp.status(200)
                    .json({ message: action
                            .concat(" for user '"
                            .concat(username
                            .concat("' successful!!")))})
                            .end();
    });
});

app.delete('/account/:name', (req, resp) => {
    
    var username = req.params.name;
    var myPath = ".DB/".concat(username, ".json");
    
    if(!fs.existsSync(myPath)) {
        return resp.status(404)
                    .json( { error: "user not found"})
                    .end();
    }
    var token = req.headers.token;

    var me = JSON.parse(fs.readFileSync(myPath));
    var JWT = me.JWT;

    if (!token) {
        return resp.status(412)
                    .json({ error: "No token provided!" })
                    .end();
    }

    jwt.verify(token , JWT, async (err) => {
        if (err) {
            return resp.status(401)
                        .json({ error: "Unauthorized!"})
                        .end();
        }

        fs.unlinkSync(myPath);
        
        return resp.status(200)
                    .json({ message: "account deleted" })
                    .end();
        
    });
});