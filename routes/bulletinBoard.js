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
        const discordUserId = req.body.discordUserId;
        const discordServerId = req.body.discordServerId;
        console.log(req.body)
        let userInGroup = await helpers.checkDiscordUserInDiscordServer(discordServerId, discordUserId);
        if (userInGroup) {
            try {
                groupDetails = await RoommateGroup.findOne({discordServerId: discordServerId});
                let bulletinBoard = groupDetails.bulletinBoard;
                console.log(groupDetails)
                res.status(200).send(bulletinBoard);
            } catch(err) {
                res.status(400).send(err);
            }
        }
        else {
            res.status(403).send("Incorrect Permissions")
        }
    }
    catch(err) {
        res.status(400).send(err);
    }
});

router.post('/addEvent', async (req, res) => {
    try{
        let discordUserId = req.body.discordUserId;
        let discordServerId = req.body.discordServerId;
        let message = req.body.message;

        let event = {
            discordUserId: discordUserId,
            message: message
        }

        try {
            let userInGroup = await helpers.checkDiscordUserInDiscordServer(discordServerId, discordUserId)
            if (userInGroup) {
                RoommateGroup.findOneAndUpdate(
                    {discordServerId: discordServerId},
                    {"$push" : { bulletinBoard: event }}, 
                    null,
                    (error, result) => {
                        if (error) {
                            console.log(error)
                            res.status(400).send(error);
                            return;
                        } else {
                            res.status(200).send(result);
                            return;
                        }
                    }
                )  
            }

            else {
                res.status(403).send("Incorrect Permissions");
                return;
            }
            
        } catch (err) {
            res.status(400).send(err);
            return;
        }
    }
    catch(err){
        res.status(400).send(err);
        return;
    }
});


router.delete('/deleteEvent', async (req, res) => {
    try{
        let eventId = req.body.eventId;
        let discordUserId = req.body.discordUserId;
        let discordServerId = req.body.discordServerId;

        try {
            let userInGroup = await helpers.checkDiscordUserInDiscordServer(discordServerId, discordUserId)
            if (userInGroup) {
                RoommateGroup.findOneAndUpdate(
                    {discordServerId: discordServerId},
                    {"$pull" : {bulletinBoard: {_id: eventId}}}, 
                    null,
                    (error, result) => {
                        if (error) {
                            console.log(error)
                            res.status(400).send(error)
                            return
                        } else {
                            console.log(result)
                            res.status(200).send("Successful Deletion")
                            return
                        }
                    }
                )  
            }
            else {
                res.status(403).send("Incorrect Permissions or Incorrect IDs");
                return;
            }
                
            
        } catch (err) {
            res.status(400).send(err);
            return;
        }
    }

    catch(err){
        res.json({message: err});
        return;
    }
});

module.exports = router;