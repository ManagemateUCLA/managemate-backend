// creating a router 
const router = require("express").Router();
const RoommateGroup = require('../model/RoommateGroup');
const User = require('../model/User');
const constants = require('../constants');
const helpers = require('../helpers/general');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { response } = require('express');
const verify = require("./verifyJWTToken");

/**
 * * Inserts Google Calendar API token for the User
 */
 router.post('/addToken', async (req, res) => {
    try{
        let user_token = req.body['token'];
        let user_id = req.body['uid'];

        User.findOneAndUpdate(
            {_id: user_id}, 
            {gcal_token: user_token},
            null,
            (error, result) => {
                if (error) {
                    console.log(error)
                    res.status(400).send(error)
                    return;
                } else {
                    console.log(result)
                    res.status(200).send("Sucessfully added token");
                    return;
                }
            }
        );
    }
    catch(err){
        res.json({message: err});
    }
});

module.exports = router;