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
const { assert } = require("console");

const days_of_the_week = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const day_index = { 
    "Sunday": 0,
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 6
}

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
            'start':start_time
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

function isCorrectTimeFormat(input) {
    if (input.length != 5 || input[2] != ':' || 
        !('0' <= input[0] && input[0] <= '2') ||
        !('0' <= input[1] && input[1] <= '9') || 
        !('0' <= input[2] && input[2] <= '5') || 
        !('0' <= input[3] && input[3] <= '9'))
    return false;
  
    if (input[0]==='2' && !('0' <= input[1] && input[1] <= '3'))
     return false;
    return true;
}

function dateMax(date1, date2) {
    if (date1 <= date2) {
        return date2;
    }
    return date1;
}

function mergeEvents(intervals) {
    intervals.sort((a,b) => a.start - b.start);
    const results = [];
    for(let interval of intervals) {
        const prev = results.at(-1);
        if (!results.length || prev.end < interval.start) {
            results.push(interval);
        } else {
            prev.end = dateMax(prev.end, interval.end);
        }
    }
    return results;
};

// no events should be scheduled between 8pm and 8am, so this function makes night an event by blocking it off
function blockOffNights(event_list) {
    let rn = new Date();
    for (let i=0; i < 7; i++) {
        let night_start = rn;
        night_start.setHours(20);
        night_start.setMinutes(00);
        night_start.setDate(rn.getDate() + i);

        let night_end = rn;
        night_start.setHours(8);
        night_start.setMinutes(00);
        night_start.setDate(rn.getDate() + i + 1);

        let event = {name: 'night', start: night_start, end: night_end};
        event_list.push(event);
    }

}

function parseChoreTime(chore_time_string) {
    const hr_str = chore_time_string[0] + chore_time_string[1];
    const min_str = chore_time_string[3] + chore_time_string[4];
    let storage_object = {};
    storage_object['hours'] = Number(hr_str);
    storage_object['minutes'] = Number(min_str);
    return storage_object;
}

// function responsible to merge events that are overlapping and returns events mapped by day
function parseEventList(event_list) {

    blockOffNights(event_list);

    event_list.sort(function(a,b) {
        let start1 = a.start;
        let start2 = b.start;

        if (start1 < start2) return -1;
        if (start1 > start2) return 1;
        return 0;
    })

    // merge overlapping events
    event_list = mergeEvents(event_list);

    if (event_list.length === 0)
        return null;

    // get the date-time of cutoff of the events after a week from now, which is when the user events are fetched from
    let end_time = new Date() + 7; 
    end_time.setHours(23);
    end_time.setMinutes(59);

    // for all elements, ensure none of them slip over the 7 days
    for(let i=0; i<event_list.length; i++) {
        let curr_event = event_list[i];
        if (curr_event.start > end_time) {
            // remove it from the list entirely
            arr.splice(i, 1);

        } else if (curr_event.end > end_time) {
            // slice the event
            curr_event.end = end_time;
        }
    }

    let day_bucket = [[]];
    for (let i = 0; i < event_list.length; i++) {
        const event = event_list[i];

        if (event.start.getDay() != event.end.getDay()) {
            let event1 = {'name': new String(event.name), 'start': new Date(event.start), 'end': new Date(event.start)};
            event1.end.setHours(23);
            event1.end.setMinutes(59);

            assert(event1.end !== event.start);

            let event2 = {'name': new String(event.name), 'start': new Date(event.end), 'end': new Date(event.end)};
            // override day to the next day
            event2.start.setDate(event2.start.getDate() + 1);
            event2.start.setHours(0);
            event2.start.setMinutes(0);

            // event2 is not the current loop's concern. it could be further split.
            // add it into the list for the next index
            event_list.splice(i+1, 0, event2);
            
            // insert current event to the bucket
            day_bucket[event1.start.getDay()].push(event1);

        }
        else {
            day_bucket[event.start.getDay()].push(event);
        }
    }
    return day_bucket;
}



function findTimeInDay(chore, events) {
    // it is assumed that the beginning and end of the day
    // is already blocked off due to it being a night
    // by the time executation reaches this line of code
    
    if (events.length <= 0) {
        return null;
    }

    let millisecond_duration = chore.duration * 60 * 1000; // convert minutes to milliseconds
    
    for (let i = 0; i < events.length - 1; i++) {
        const curr_event = events[i];
        const next_event = events[i+1];
        if (chore.start) {
            let chore_start_obj = parseChoreTime(chore.start)
            // want to create a date time object for the chore
            let chore_start = new Date(events[0].start);
            chore_start.setHours(chore_start_obj.hours);
            chore_start.setMinutes(chore_start_obj.minutes);
            
            let chore_end = new Date(chore_start);
            chore_end.setTime(chore_start.getTime() + millisecond_duration);

            if (curr_event <= chore_start && (next_event.getTime() - chore_start.getTime() >= millisecond_duration)) {
                // construct the schedule
                const assigned_chore = {
                    name: chore.name,
                    start: chore_start,
                    end: chore_end
                }
                return assigned_chore;
            }

        } else {
            if (next_event.getTime() - curr_event.getTime() >= millisecond_duration) {
                let chore_start = new Date(curr_event.start);
                let chore_end = new Date(chore_start);
                chore_end.setTime(chore_start.getTime() + millisecond_duration);

                const assigned_chore = {
                    name: chore.name, 
                    start: chore_start,
                    end: chore_end
                };

                return assigned_chore;
            }
        }
    }

    // no suitable time was found
    return null;
}

function findAvailableTime(chore, event_list, days_to_search) {


    // let chore_start = chore['start_time']; // HH:MM
    // if (!isCorrectTimeFormat(chore_start)) {
    //     throw Error("Bad chore time format");
    // }

    // find the days to search
    let day_indices_to_search = [];
    for (const day in days_to_search) {
        day_indices_to_search.push(day_index[day]);
    }

    let day_bucket = parseEventList(event_list);
    for (let index in day_indices_to_search) {
        let day_events = day_bucket[index];

        let assigned_chore = findTimeInDay(chore, day_events);
        if (assigned_chore) {
            return assigned_chore;
        }
    }

    // couldn't find any available timeslot
    return null;

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

    let users = doc[0]['members'];
    let user_info = {}; // dictionary of uid -> dict {name, token, events}

    // retrieve and store user info
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
            
            // add assigned chore to users events to ensure that another chore is not assigned there again
            user_info[assigned_chore.associated_with]['events'].push({
                'name': assigned_chore.name,
                'start': assigned_chore.start,
                'end': assigned_chore.end
            });
            
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