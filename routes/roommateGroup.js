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
const { group } = require("console");

/**
 * * Gets the group details based on the uid in jwt token 
 */
router.get('/', verify, async (req, res) => {
    try{
        const userObj = await User.findById(req.user._id);
        const gid = userObj.gid;
        try {
            groupDetails = await RoommateGroup.findOne({gid: gid});
            res.status(200).send(groupDetails);
        } catch (err) {
            res.status(400).send(err);
        }
    }
    catch(err){
        res.json({message: err});
    }
});

/**
 * ! This will only create the group, the creator needs to be added to the group 
 * * Creates a new roommate group with the provided name 
 */
router.post('/create', verify, async (req, res) => {
    // Expected Request Body
    // {
    //     groupName: "LF Group",
    // }
    let reqObj = req.body;
    let userObj = req.user;
    if (!reqObj) {
        res.status(404).send("Bad Request Format: " + req.body)
    }

    let tooManyRepeatedTries = 0;

    if (!reqObj.groupName) {
        res.status(400).send("Group name is required to create group")
        return;
    }
    let gid = null;
    while (true) {
        gid = helpers.randomStr(constants.GROUP_ID_LENGTH, constants.ALPHANUMERIC_STRING);

        // check if the newly generated gid exists 
        let roommateGroupExists = await RoommateGroup.findOne({gid: gid});
        
        // valid GID if unique 
        if(!roommateGroupExists) {
            let newRoommateGroup = new RoommateGroup({
            gid: gid,
            name: reqObj.groupName,
            members: [userObj._id],
            discordlink: ""
            }); 
        
            // save the newly created group
            try {
                const savedGroup = await newRoommateGroup.save();
                break;
            } catch(err) {
                // save failed: MongoDB error
                res.status(400).send("Could not create new roommate group!")
                break;
            }
        }

        else {
            // very rare: implies 1000 creatiosn of 6 digit random string matched existing gid 
            if (tooManyRepeatedTries >= constants.MAX_ATTEMPTS) {
                res.status(404).send("Request timed out: invalid roommate group creation!")
                break;
            }
            // newly generated gid matches an existing gid - try again 
            else {
                tooManyRepeatedTries+=1;
            }
        }
    }
    res.status(200).send({gid: gid});
});

/**
 * * Joins the user in the group passed in body and updates the gid in user database 
 */
router.post('/join', verify, async (req, res) => {
    /*
        Expected fields in request body
        {
            'gid': String
        }
    */
    const groupId = req.body.gid
    const userId = req.user._id

    if(!groupId)
    {
        return res.status(400).send("GID is required to join group")
    }

    let checkUserIsInGroup = await helpers.checkUserInGroup(groupId, userId);
    if (checkUserIsInGroup) {
        return res.status(400).send("User is already in the group")
    }

    // add user to the group
    let addUser = await RoommateGroup.findOneAndUpdate(
        {gid: groupId},
        {"$push" : {members: userId}}, 
        null
    ).then(function (result, error)  {
        if (error) {
            console.log(error);
            res.status(400).send(error);
            return;
        } else {
            console.log(result);
        }
    })

    // set gid in user database for this user 
    await User.findOneAndUpdate(
        {_id: userId},
        {gid: groupId},
        null
    ).then(function (result, error)
    {
        if (error) {
            console.log(error);
            res.status(400).send(error);
            return;
        } else {
            console.log(result);
        }
    })
    
    res.status(200).send("OK");
}
);

router.post('/linkGroup', async (req, res) => {
    const gid = req.body.gid;
    const discordUserId = req.body.discordUserId;
    const discordServerId = req.body.discordServerId;
    try {
        let userObject = await User.findOne({discordUserId: discordUserId});
        let uid = await userObject._id;
        // checking if this group has this user within it
        let userInGroup = await helpers.checkUserInGroup(gid, uid);
        if (userInGroup) {
            // we link the roommate group id to the discord server id
            let filter = {gid: gid};
            let update = {discordServerId: discordServerId}
            console.log("hi");
            RoommateGroup.findOneAndUpdate(
                filter,
                update, 
                null,
                (error, result) => {
                    if (error) {
                        console.log(error)
                        res.status(400).send(error);
                        return;
                    } else {
                        console.log(result)
                        res.status(200).send("Updated discordServerId and gid");
                        return;
                    }
                }
            )

        }
        else {
            res.status(404).send("Unable to find the gid/permission issue");
            return;
        }

    } catch (err) {
        res.status(400).send(err);
        return;
    }
})


/**
 * * Removes the user from the group passed in body and updates the gid in user database 
 */
 router.post('/leave', verify, async (req, res) => {
    /*
        Expected fields in request body
        {
            'gid': String
        }
    */
    const groupId = req.body.gid
    const userId = req.user._id
    // remove user from the group
    try {
        await RoommateGroup.findOneAndUpdate(
            {gid: groupId},
            {"$pull" : {members: userId}}, 
            null,
            (error, result) => {
                if (error) {
                    console.log(error);
                    res.status(400).send(error);
                    return;
                } else {
                    console.log(result);
                }
            }
        )
    }
    catch(err) {
        // update failed: MongoDB error
        res.status(400).send("Could not remove user from group!")
    }

    try {
        // set gid in user database for this user 
        await User.findOneAndUpdate(
            {_id: userId},
            {gid: ''},
            null,
            (error, result) =>{
                if (error) {
                    console.log(error);
                    res.status(400).send(error);
                    return; 
                } else {
                    console.log(result);
                }
            }
        )  
        res.status(200).send("OK");
    }  
    catch(err) {
        // update failed: MongoDB error
        res.status(400).send("Could not set group gid in user schema!")
    }
}
);

router.get('/:gid/listRoommates',  async (req, res) => {
    try {

        let gid = req.params['gid'];
        const group_info = await RoommateGroup.findOne({gid: gid});
        let members = group_info.members;
        let names = [];
        for (let id of members) {
            const user_info = await User.findOne({_id: id});
            names.push(user_info.name);
        }   
        console.log(names);
        res.status(200).send(names);
        return;

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
        return;
    }
    
})

module.exports = router;