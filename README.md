###### Dati studente ###
*nome e cognome*
Matteo Serafini

*matricola*
293168

###### API Info ###
(Titolo)**Data-Covid-API**
(Repository)[https://github.com/Matteoserafini-lab/dati-covid]
(Contact-issues-bugs)[https://github.com/Matteoserafini-lab/dati-covid/issues]

###### Descrizione ###
Restful API per richiedere e visualizzare i dati regionali o nazionali del coronavirus in Italia in una specifica data sfruttando i dati in formato *json* messi a dispozizione dal repository della protezione civile ai seguenti links:
(dati Italia)[https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-andamento-nazionale.json]
(dati regionali)[https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-regioni.json]
È previsto che l'utente sia registrato per visualizzare i dati.

###### Metodi ###
Per una descrizione dei metodi dell' API è disponibile al seguente link
[https://htmlpreview.github.io/?https://github.com/Matteoserafini-lab/dati-covid/blob/master/index.html]


###### Scelte di progetto ###
API basata sul modello *RESTful*

# Linguaggio
**NodeJS**

# Moduli aggiuntivi
**express**
    usato per facilitare le operazioni di comunicazione client-server
    esempio:
    *accedere alla schermata iniziale*

        app.get('/', (req, resp) => {
            resp.status(200).send('API to check Covid-19 data in Italy');
        });

**lowdb**
    usato per la creazione e gestione del database degli utenti
    esempio:
    *controllare se l'username(che deve essere unico) scelto è presente nel database*
        
        const user = db.get("users")
                        .find({username: username});
        
        if(user.value()) {
            return resp.status(400)
                        .json( {error: "username already in use"})
                        .end();
        }

**moment**
    usato per la validazione delle date
    esempio:
    *validazione data*

        if ((!moment(date, "YYYY-MM-DD").isValid()) || (date.length != 10)){
            return resp.status(406)
                        .json( { error: "wrong date format!!"})
                        .end();
        }

**crypto** & **jsonwebtoken**
    usati per autenticazione ed autorizzazzione
    esempi:
    *signup*

        var salt = crypto.randomBytes(16).toString('hex');

        var hash = crypto.pbkdf2Sync(req.headers.password, salt, 1000, 64, `sha512`).toString(`hex`); 
    
        var newUser = { username: username, 
                    password: hash,
                    salt: salt,
                    JWT: ""}
_
    *login*

        var JWT = crypto.randomBytes(16).toString('hex');
        
        var hash2 = crypto.pbkdf2Sync(req.headers.password, salt, 1000, 64, `sha512`).toString(`hex`);

        if(hash == hash2){ 
            var token = jwt.sign({ username }, JWT, {
                expiresIn: 8000
            });
_
    *autorizzazione*

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
    
**axios**
    usato per operazioni di tipo client
    esempio:
    *richiesta dati nazionali dal repository della protezione civile*

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

###### Servizi esterni ###
l'app è disponibile tramite il servizio **Heroku** che permette l'uso di un canale HTTPS e la *continuous integration* dell' API
[https://dati-covid.herokuapp.com]

###### Licenza ###
È stata scelta la licenza *CC0 1.0 Universal*[https://creativecommons.org/licenses/by/4.0] medesima alla licenza del repository dei dati covid della protezione civile[https://github.com/pcm-dpc/COVID-19]
