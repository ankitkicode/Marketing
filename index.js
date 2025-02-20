const express = require('express');
const app = express();
const port = 3000;

// Import the database connection
const dbConnection = require('./database/dbConnection');
dbConnection().then(() => {
    console.log('Database connection successful');
}).catch((error) => {
    console.error('Database connection error', error);
});



app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/auth', require('./routes/userRoutes'));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});