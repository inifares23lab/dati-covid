// Import express
const express = require('express');

// Import Body parser
const bodyParser = require('body-parser');

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


