const express = require('express');
const app = express();
const dotenv = require('dotenv');
const connectDB = require("./db");

// Import Routes 
const authRoute = require('./routes/auth');
dotenv.config();

// connect to DB 
connectDB();

// Middlewares
app.use(express.json());

// Route Middlewares 
app.use('/auth', authRoute);

const portNumber = process.env.PORT || 3000;
app.listen(portNumber, function () {
    console.log("Managemate Backend listening on port " + portNumber);
});



async function addToGroup() {
 // Checking if email exists 
 const user = await roommateGroupSchema.findOne({email: req.body.email});
 if(!user) return res.status(400).send('User is not registered');
}

class FormObject {
  constructor(name, email, groupName) {
    this.name = name;
    this.email = email;
    this.groupName = groupName;
  }
}

function randomStr(len, arr) {
  var ans = '';
  for (var i = len; i > 0; i--) {
      ans += 
        arr[Math.floor(Math.random() * arr.length)];
  }
  return ans;
}
