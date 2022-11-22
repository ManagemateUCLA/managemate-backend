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


router.post('/', async (req, res) => {
    try{
        const gid = req.body.gid;
        const uid = req.body.uid;
        console.log(req.body)
        let userInGroup = helpers.checkUserInGroup(gid, uid)
        if (userInGroup) {
            try {
                groupDetails = await RoommateGroup.findOne({gid: gid});
                let bulletinBoard = groupDetails.bulletinBoard;
                console.log(groupDetails)
                res.status(200).send(bulletinBoard);
            } catch(err) {
                res.status(400).send(err);
            }
        }
        else {
            res.status(400).send("Incorrect Permissions")
        }
    }

    catch(err) {
        res.status(400).send(err);
    }
});

router.post('/addEvent', async (req, res) => {
    try{
        let uid = req.body.uid;
        let gid = req.body.gid;
        let message = req.body.message;
        let event = {
            uid: uid,
            message: message
        }
        try {
                // add user to the group
            console.log(uid, gid, message);
            let resp = await helpers.checkUserInGroup(gid, uid)
            
            RoommateGroup.findOneAndUpdate(
                {gid: gid},
                {"$push" : { bulletinBoard: event }}, 
                null,
                (error, result) => {
                    if (error) {
                        console.log(error)
                        res.status(400).send(error)
                    } else {
                        console.log("hi");
                        // console.log(result)
                    }
                }
            )  
        } catch (err) {
            res.status(400).send(err);
        }
    }

    catch(err){
        res.json({message: err});
    }
   
});


router.post('/deleteEvent', verify, async (req, res) => {
    try{
        let _id = req.body._id;
        let event = req.body.event;
        try {
                // add user to the group
            RoommateGroup.findOneAndUpdate(
                {gid: groupId},
                {"$pull" : {bulletinBoard: {$in: [event]}}}, 
                null,
                (error, result) => {
                    if (error) {
                        console.log(error)
                        res.status(400).send(error)
                    } else {
                        console.log(result)
                    }
                }
            )  
        } catch (err) {
            res.status(400).send(err);
        }
    }

    catch(err){
        res.json({message: err});
    }
});

module.exports = router;