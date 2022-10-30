// creating a router 
const router = require('express').Router();
const RoommateGroup = require('../model/RoommateGroup');
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../validation')



router.post('/join', verify, async (req, res) => {
    /*
        Expected fields in request body
        {
            'gid': String
            'user name': String
            'uid': String
        }
    */
    const groupId = req.body.gid
    const userId = req.body.uid
    RoommateGroup.findOneAndUpdate(
        {gid : groupId},
        {"$push" : {members: uid}}, 
        null,
        (error, result) =>{
            if (error) {
                console.log(error)
            } else if (!result) {
                return res.status(400).send("Could not find roommate group!")
            }
        }
    )
    
    User.findOneAndUpdate(
        {_id: uid},
        {gid: groupId},
        null,
        (error, result) =>{
            if (error) {
                console.log(error)
            } else if (!result) {
                return res.status(400).send("Could not find user!")
            }
        }
    )    
}
)