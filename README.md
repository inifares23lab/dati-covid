#nome #cognome
Matteo Serafini

#matricola
293168

#titolo
dati-covid

#descrizione
API per richiedere e visualizzare i dati regionali o nazionali del coronavirus in italia in una specifica data.
È previsto che l'utente sia registrato per visualizzare i dati.

#metodi
GET '/'
comunica una brevissima descrizione dell'api

POST '/account'
permette di registrarsi con un username univoco e password generata da un salt casuale ed l' algoritmo sha512

GET '/account/:name'
si accede all' account ':name' e si effettua il login generando una signingkey personale su cui verrà generato un token valido per un giorno 

if logged in :
PATCH '/account/:name'
permette di scegliere una nuova password

PUT '/account/:name'
effettua il log out eliminando la signinkey

DELETE '/account/:name'
cancella la registrazione alla API

GET '/regions/:name/:date'
fornisce i dati per le regioni specificate nel corpo della richiesta nella data specificata nell'url

GET '/italy/:name/:date'
fornisce i dati dall' andamento nazionale nella data specificata nell'url

#scelte di progetto
API basata sul modello RESTful
linguaggio:
_NodeJS
moduli aggiuntivi:
_express
_fs
_moment
_crypto
_jsonwebtoken
_axios

#servizi esterni
l'app è disponibile tramite il servizio Heroku che permette l'uso di un canale HTTPS e la 'continuous integration' dell' API

#licenza
È stata scelta la licenza 'CC0 1.0 Universal' in in quanto imposta dalla medesima licenza del repository dei dati covid della protezione civile
