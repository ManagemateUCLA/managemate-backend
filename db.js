const mongoose = require('mongoose')
require('dotenv').config()

const URI = process.env.DB_CONNECTION

const connectDB = () => {
    mongoose.connect(URI)
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "Connection ERROR: "));
    db.once("open", function () {
    console.log("MongoDB server connected successfully");
    })
};

module.exports = connectDB;