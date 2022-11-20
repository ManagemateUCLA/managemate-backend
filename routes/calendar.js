// creating a router 
const router = require("express").Router();
const RoommateGroup = require('../model/RoommateGroup');
const User = require('../model/User');
const Calendar = require('../model/Calendar');
const constants = require('../constants');
const helpers = require('../helpers/roommateGroup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { response } = require('express');
const verify = require("./verifyJWTToken");



router.post('/:gid/createChore',  async (req, res) => {
    // console.log(req.body);
    // console.log(req);
    try {
        let gid = req.params['gid'];
        let task_name = req.body['name'];
        let start_time = req.body['time_of_day_start'];
        let duration = req.body['duration'];
        let preferred_days = req.body['preferred_days'];

        let event_object = {
            'name': task_name,
            'duration': duration,
            'preferred_days': preferred_days,
            'start_time':start_time
        }
        
        Calendar.findOneAndUpdate(
            {'gid': gid},
            {"$push": {"added_events":event_object}},
            {upsert: true, setDefaultsOnInsert: true},
            (error, result) => {
                if (error) {
                    console.log(error)
                    res.status(400).send(error)
                } else {
                    // console.log(result)
                    res.status(200).send("Success")
                }
            }
        )
    } 
    catch(err){
        res.json({message: err});
    }
}
);

router.delete('/:gid/deleteChore', async(req, res) => {
    try {
        let gid = req.params['gid'];
        let chore_id = req.query['choreid'];
        
        // delete by chore id
        Calendar.updateOne(
            {'gid':gid},
            {"$pull": {'added_events': {'_id': {'$eq': chore_id}}}},
            null,
            (error, result) => {
                if (error) {
                    console.log(error)
                    res.status(400).send(error)
                } else {
                    console.log(result)
                    res.status(200).send("Success")
                }
            }
        )

    } catch (err) {
        res.json({message: err});
    }
});

router.get('/:gid/getChores', async(req,res) => {
    try{
        let gid  = req.params['gid'];
        Calendar.find({'gid':gid}, (error, result)=>{
            if (error) {
                console.log(error)
                res.status(400).send(error)
            } else {                
                console.log(result);
                if (result.length <= 1) {
                    //TODO: think about updating this response number and object
                    res.status(400).send({message: "No events to display"});
                } else {
                    res.status(200).send(result[0]['added_events']);
                }
            }
        });
    } catch (err) {
        res.json({message: err});
    }
});

function moveIndexToEnd(arr, index) {
    if (index > -1) {
        let val = arr[index];
        arr.splice(index, 1);
        arr.push(val);
    }

    return arr;
}

function findAvailableTime(event_list, chore) {
    
}

async function scheduleChores(gid) {

    // get all the users
    const doc =  await RoommateGroup.find({'gid': gid});
    const calendar = await Calendar.find({'gid':gid});
    const chores = calendar['added_events'];

    // use of the followig data structure would be better as a min heap
    let users = doc['members'];
    let existing_events = {}; // dictionary of uid -> events
    for (let i = 0; i < users.length; i++) {
        const uid = users[i];
        const user = await User.find({'uid':users[i]});
        const token = user['gcal_token'];

        //TODO: call function that returns all events for user, and add to the dict of events

    }

    let assigned_chores = []; // array of finalized chores
    
    for (let chore in chores) {
        // pass 1: see if chore meets any of the members requirements for the preferred dates
        for (let user in users) {

        }

        // see if the chore eets any of the memebers calendars

        // finally, put th member at the end to give them last preference to be selected for a chore again

    }

    // put the assignements in the db
    // put the assignments in the user calendar, so much keep track by user id

}

module.exports = router;