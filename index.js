const express = require('express');
const app = express();
const dotenv = require('dotenv');
const connectDB = require("./db");

// Import Routes 
const authRoute = require('./routes/auth');
const roommateGroupRoute = require('./routes/roommateGroup');
const bulletinBoardRoute = require('./routes/bulletinBoard');

dotenv.config();

// connect to DB 
connectDB();

// Middlewares
app.use(express.json());

// Route Middlewares 
app.use('/auth', authRoute);
app.use('/roommateGroup', roommateGroupRoute);
app.use('/bulletinBoard', bulletinBoardRoute)

const portNumber = process.env.PORT || 3000;
app.listen(portNumber, function () {
    console.log("Managemate Backend listening on port " + portNumber);
});



