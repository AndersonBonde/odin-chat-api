const express = require('express');
const passport = require('passport');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cors());

require('./config/passportConfig')(passport);

app.use(require('./routes'));

app.listen(3000, () => console.log(`App listening on port 3000`));
