const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Import Routes 
const authRoute = require('./routes/auth');
dotenv.config();

// connect to DB 
mongoose.connect(process.env.DB_CONNECTION);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

// Middlewares
app.use(express.json());

// Route Middlewares 
app.use('/api/user', authRoute);

app.listen(3000, () => console.log('server up and running'));