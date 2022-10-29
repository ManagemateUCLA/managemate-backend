// creating a router 
const router = require('express').Router();
const RoommateGroup = require('../model/RoommateGroup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../validation');
const { response } = require('express');


function randomStr(len, arr) {
    var ans = '';
    for (var i = len; i > 0; i--) {
        ans += 
          arr[Math.floor(Math.random() * arr.length)];
    }
    return ans;
  }
  
  const alphanumericArray = "12345abcdefgh"
  
  async function createGroup(formObject) {
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
   return null;
  }
  
  router.post('/create', async (req, res) => {
    console.log(req.body);
    // some logic to create FormObjectfrom given req.body 
    // call createGroup()
    response = createGroup(formObject);
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
  }
