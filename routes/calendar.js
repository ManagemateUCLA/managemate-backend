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
const { getEventListeners } = require("events");

const days_of_the_week = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];


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
                    return;
                } else {
                    // console.log(result)
                    res.status(200).send("Success")
                    return;
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
                    return;
                } else {
                    console.log(result)
                    res.status(200).send("Success")
                    return;
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
                if (result.length < 1) {
                    //TODO: think about updating this response number and object
                    res.status(400).send({message: "No events to display"});
                    return;
                } else {
                    res.status(200).send(result[0]['added_events']);
                    return;
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

function getStartTime(event) {
    // based on google calendar format
    return event['start'];
}

function getEndTime(event) {
    // based on google calendar format
    return event['end'];
}


function findAvailableTime(chore, event_list, days_to_search) {
    event_list.sort(function(a,b) {
        let start1 = getStartTime(a);
        let start2 = getStartTime(b);

        if (start1 < start2) return -1;
        if (start1 > start2) return 1;
        return 0;
    })



    for (let i = 0; i < event_list.length - 1; i++) {
        
    }

}

function findMatchingUser(chore, user_list, user_info, days_to_search = days_of_the_week) {
    for (let i = 0; i < user_list.length; i++) {
        let user = user_list[i];

        // find if the chore can be assigned to the current user being searched
        let assigned_chore = findAvailableTime(chore, user_info[user]['events'], days_to_search);
        if (assigned_chore != null) {
            // assign to user
            assigned_chore['associated_with'] = user;
            assigned_chore['associated_with_name'] = user_info[user]['name'];
            moveIndexToEnd(user_list, i);
            return assigned_chore;
        }
    }
    return null;
}

// caller function must take care of any errors thrown
async function scheduleChores(gid) {

    // get all the users
    const doc =  await RoommateGroup.find({'gid': gid});
    if (doc.length < 1) {
        throw Error("No collection with the gid exists");
    }
    const calendar = await Calendar.find({'gid': gid});
    const chores = calendar['added_events'];

    // use of the followig data structure would be better as a min heap
    let users = doc[0]['members'];
    let user_info = {}; // dictionary of uid -> dict {name, token, events}
    for (let i = 0; i < users.length; i++) {
        const uid = users[i];
        const user = await User.find({'uid':users[i]});
        const token = user['gcal_token'];
        const name = user['name'];
        //call function that returns all events for user, and add to the dict of events
        const events = getEvents(token);

        const curr_user_info = {
            name: name,
            token: token,
            events: events
        };

        user_info[uid] = curr_user_info;
    }

    let assigned_chores = []; // array of finalized chores
    let unassigned_chores = [];
    
    for (let chore in chores) {
        // pass 1: see if chore meets any of the members requirements for the preferred dates
        let assigned_chore = findMatchingUser(chore, users, user_info, chore['preferred_days']);

        if (assigned_chore) {
            assigned_chores.push(assigned_chore);
            continue;
        }

        // pass 2: ignore preferences on days
        assigned_chore = findMatchingUser(chore, users, user_info); 
        if (assigned_chore) {
            assigned_chores.push(assigned_chore);
        } else {
            unassigned_chores.push(chore);
        }
    }

    // create events in user calendars
    for (let assigned_chore in assigned_chores) {
        const assigned_user = assigned_chore['assigned_user'];
        const token = user_info[assigned_user]['token'];
        const event_id = addEvent(token, assigned_chore);
        assigned_chore['gcal_event_id'] = event_id;
    }

    // put the assignements in the db
    Calendar.findOneAndUpdate(
        {gid: gid},
        {scheduled_events: assigned_chores},
        null,
        (error, result) => {
            if (error) {
                console.log(error)
                res.status(400).send(error)
                return;
            } else {
                // console.log(result)
                res.status(200).send("Success")
                return;
            }
        }
    )
}

module.exports = router;