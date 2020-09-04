// Import express
const express = require('express');

// Import Body parser
const bodyParser = require('body-parser');

//import passport
const jwt = require("jsonwebtoken");

//import crypto
const crypto = require("crypto");

//import axios
const axios = require('axios');

//import moment
const moment = require("moment");

//import lowdb
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("db.json");
const db = low(adapter);
db.defaults({users: [], visitsPerRegion: []}).write();

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
    resp.status(200).send('API to check Covid-19 data in Italy');
});

app.post('/account', (req, resp) => {
    var username = req.body.name;

    const user = db.get("users")
                    .find({username: username});

    if(user.value()) {
        return resp.status(400)
                    .json( {error: "username already in use"})
                    .end();
    }

    var salt = crypto.randomBytes(16).toString('hex'); 
    
    // Hashing user's salt and password with 1000 iterations, 64 length and sha512 digest 
    var hash = crypto.pbkdf2Sync(req.headers.password, salt, 1000, 64, `sha512`).toString(`hex`); 

    var newUser = { username: username, 
                password: hash,
                salt: salt,
                JWT: ""}
    
    db.get('users')
        .push(newUser)
        .write();

    return resp.status(201)
                .json({ message: username
                .concat(" added!!")})
                .end();
    
});    

app.get('/account/:name', (req, resp) => {

    var username = req.params.name;

    const user = db.get("users")
                    .find({username: username});
    
    if(!user.value()) {
        return resp.status(400)
                    .json( {error: "username not found"})
                    .end();
    }

    var hash = db.get("users")
                .filter({username: username})
                .map("password")
                .value()
                .toString();

    var salt = db.get("users")
                .filter({username: username})
                .map("salt")
                .value()
                .toString();

    var JWT = crypto.randomBytes(16).toString('hex');

    var hash2 = crypto.pbkdf2Sync(req.headers.password, salt, 1000, 64, `sha512`).toString(`hex`); 
    if(hash == hash2){ 
        var token = jwt.sign({ username }, JWT, {
            expiresIn: 8000
        });

        user.assign({JWT: JWT})
            .write();

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
    var username = req.params.name;
    
    const user = db.get("users")
                    .find({username: username});

    if(!user.value()) {
        return resp.status(400)
                    .json( {error: "username not found"})
                    .end();
    }
        
    var JWT = db.get("users")
                .filter({username: username})
                .map("JWT")
                .value()
                .toString();
    
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

        
        user.assign({password: hash})
            .assign({salt: salt})
            .assign({JWT: JWT})
            .write();

        return resp.status(200)
                    .json({ message: "update successful!!"})
                            .end();
    });
});

app.put('/account/:name', (req, resp) => {
    var username = req.params.name;
    
    const user = db.get("users")
                    .find({username: username});
    
    if(!user.value()) {
        return resp.status(400)
                    .json( {error: "username not found"})
                    .end();
    }    
    
    var JWT = db.get("users")
                .filter({username: username})
                .map("JWT")
                .value()
                .toString();
    
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

        user.assign({JWT: ""})
            .write();

        return resp.status(200)
                    .json({ message: "logout successful!!"})
                            .end();
    });
});

app.delete('/account/:name', (req, resp) => {
    
    var username = req.params.name;
    const user = db.get("users")
                    .find({username: username});
    
    if(!user.value()) {
        return resp.status(400)
                    .json( {error: "username not found"})
                    .end();
    }    
    
    var JWT = db.get("users")
                .filter({username: username})
                .map("JWT")
                .value()
                .toString();

    var token = req.headers.token;

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

        db.get("users")
            .remove({username: username})
            .write();

        return resp.status(200)
                    .json({ message: "account deleted" })
                    .end();
        
    });
});


app.post('/regions/:name/:date', (req, resp) => {
    
    var username = req.params.name;
    var date = req.params.date;
        
    if ((!moment(date, "YYYY-MM-DD").isValid()) || (date.length != 10)){
        return resp.status(406)
                    .json( { error: "wrong date format!!"})
                    .end();
    }
    
    const user = db.get("users")
                    .find({username: username});
    
    if(!user.value()) {
        return resp.status(400)
                    .json( {error: "username not found"})
                    .end();
    }  

    var JWT = db.get("users")
                .filter({username: username})
                .map("JWT")
                .value()
                .toString();

    var token = req.headers.token;
    
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
    
        try {  
            axios.get("https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-regioni.json")
                .catch(err => {
                    console.log(err);
                })   
                .then(res => {
                    var myRegions = res.data.filter(function (reg) {
                        var myRegion;
                        for (region of req.body){
                            if((reg["denominazione_regione"] == region) &&
                                    (reg["data"].slice(0,10) == date)) {
                                var vPR = db.get("visitsPerRegion")
                                            .find({region: region});
                                if(vPR.value()) {
                                    var visits = Number(db.get("visitsPerRegion")
                                                    .filter({region: region})
                                                    .map("visits")
                                                    .value());
                                    vPR.assign({visits: [visits+1]})
                                        .write();
                                } else {
                                    var newRegion =  {region: region,
                                                    visits: 1};
                                    
                                    db.get('visitsPerRegion')
                                        .push(newRegion)
                                        .write();
                                }
                                myRegion += reg;
                            };
                        }
                        return myRegion;
                    })
                    if(myRegions.length != 0) {
                        return resp.status(200)
                                    .json(myRegions)
                                    .end();
                    }
                    return resp.status(404)
                                .json( { error: "data not found!!"})
                                .end();
                })
            } catch {
                return resp.status(400)
                            .json( { error: "something went wrong!!"})
                            .end();
            }
    });
    
});


app.get('/italy/:name/:date', (req, resp) => {
    
    var username = req.params.name;
    var date = req.params.date;
    
    if ((!moment(date, "YYYY-MM-DD").isValid()) || (date.length != 10)){
        return resp.status(406)
                    .json( { error: "wrong date format!!"})
                    .end();
    }
    
    const user = db.get("users")
                    .find({username: username});
    
    if(!user.value()) {
        return resp.status(400)
                    .json( {error: "username not found"})
                    .end();
    }  

    var JWT = db.get("users")
                .filter({username: username})
                .map("JWT")
                .value()
                .toString();

    var token = req.headers.token;
    
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

        try {  
            axios.get("https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-andamento-nazionale.json")
                .catch(err => {
                    console.log(err);
                })   
                .then(res => {
                    var myData = res.data.filter(function (data) {
                        return data["data"].slice(0,10) === date;
                    })
                    if(myData.length != 0) {
                        return resp.status(200)
                                    .json(myData)
                                    .end();
                    }
                    return resp.status(404)
                                .json( { error: "data not found!!"})
                                .end();
                })
        } catch {
            return resp.status(400)
                        .json( { error: "something went wrong!!"})
                        .end();
        }
    });  
});

app.get("/visits", (req, resp) => {
    
    var region = req.query.region;
    
    if(region != "" && region)  {
        var vPR = db.get("visitsPerRegion")
                    .filter({region: region})
                    .value();
                    
        return resp.status(200)
                    .json(vPR)
                    .end();
    }

    var vPR = db.get("visitsPerRegion")
                    .value();
                    
    return resp.status(200)
                .json(vPR)
                .end();

});