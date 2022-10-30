// creating a router 
const router = require('express').Router();
const RoommateGroup = require('../model/RoommateGroup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../validation');
const { response } = require('express');


// declaring constant string
const alphanumericArray = "0123456789abcdefghijklmnopqrstuvwxyz";

// helper function to create a string of length len
function randomStr(len, arr) {
    var ans = '';
    for (var i = len; i > 0; i--) {
        ans += 
          arr[Math.floor(Math.random() * arr.length)];
    }
    return ans;
}

  async function createGroup(formObject) {
    const MAX_ATTEMPTS = 1000;
    let tooManyRepeatedTries = 0;
    
    while (true) {
        let gid = randomStr(5, alphanumericArray)
        // Checking if email exists 
        let roommateGroupExists = await roommateGroup.findOne({gid: gid});
        
        if(!roommateGroupExists) {
            // this is a valid new GID 
            let newRoommateGroup = new RoommateGroup({
            gid: gid ,
            name: formObject.groupName,
            members: [],
            discordlink: "aritra.com"
            }); 
        
            try {
            const savedGroup = await newRoommateGroup.save();
            return gid;
            } catch(err) {
                return null;
            }
        }

        else {
            if (tooManyRepeatedTries >= MAX_ATTEMPTS) {
                return null;
            }
            else {
                tooManyRepeatedTries+=1;
            }
        }
    }
    return null;
  }
  
  router.post('/create', async (req, res) => {
    //    Expected Request Body
    // {
    //     email: "amarda@gmail.com",
    //     groupName: "LF Group",
    //     name: "Abhishek Marda",
    //     uid: "_id"
    //   }

    let formObject = new FormObject(req.body);
    if (!f) {
        res.status(404).send("Bad Request Format: " + req.body)
    }
    let response = await createGroup(formObject);
    if (!response) {
        res.status(404).send("Invalid Group ID creation");
    }
    else {
        res.status(200).send({gid: response});
    }
    
  })


  class FormObject {

    constructor(name, email, groupName, uid) {
      this.name = name;
      this.email = email;
      this.groupName = groupName;
      this.uid = uid;
    }

    constructor(jsonBbody) {
        let obj = JSON.parse(jsonBbody);
        if (obj.name !== null && obj.email != null && obj.groupName != null && obj.uid != null) {
            this.name = obj.name;
            this.email = obj.email;
            this.groupName = obj.groupName;
            this.uid = obj.uid;
        }
        else {
            this = null
        }
    }
  }
