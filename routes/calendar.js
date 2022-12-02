// creating a router 
const router = require("express").Router();
const RoommateGroup = require('../model/RoommateGroup');
const User = require('../model/User');
const Calendar = require('../model/Calendar');
const constants = require('../constants');
const gcalHelpers = require('../helpers/googleCal');
const generalHelpers = require('../helpers/general');
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

router.post('/:discordId/createChore',  async (req, res) => {
    // console.log(req.body);
    // console.log(req);
    try {
        let discordId = req.params['discordId'];
        let gid = await generalHelpers.getGroupId(discordId);
        let task_name = req.body['name'];
        if (!task_name) {
            return res.status(400).send();
        }

        let duration = req.body['duration'];
        let preferred_days = req.body['preferred_days'];
        let event_object;
        if (req.body['start']) {
            let start_time = req.body['start'];
            event_object = {
                'name': task_name,
                'duration': duration,
                'preferred_days': preferred_days,
                'start':start_time
            }
        } else {
            event_object = {
                'name': task_name,
                'duration': duration,
                'preferred_days': preferred_days,
             }
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

router.delete('/:discordId/deleteChore', async(req, res) => {
    try {
        let discordId = req.params['discordId'];
        let gid = await generalHelpers.getGroupId(discordId);
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
                    // console.log(result)
                    if (result.modifiedCount == 0) {
                        res.status(404).send("Not found chore to delete");
                    } else {
                        res.status(200).send("Success")
                    }
                    
                    return;
                }
            }
        )

    } catch (err) {
        res.json({message: err});
    }
});

router.get('/:discordId/getChores', async(req,res) => {
    try{
        let discordId = req.params['discordId'];
        let gid  = await generalHelpers.getGroupId(discordId);
        Calendar.find({'gid':gid}, (error, result)=>{
            if (error) {
                console.log(error)
                res.status(400).send(error)
            } else {                
                // console.log(result);
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

/**
 * Move index in list to the end of the list
 * @param {list} arr 
 * @param {number} index 
 * @returns updated list
 */
function moveIndexToEnd(arr, index) {
    if (index > -1) {
        let val = arr[index];
        arr.splice(index, 1);
        arr.push(val);
    }

    return arr;
}

/**
 * Checks if a string is in HH:MM format
 * @param {string} input 
 * @returns boolean
 */
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

/**
 * Returns the later of two dates
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns 
 */
function dateMax(date1, date2) {
    if (date1 <= date2) {
        return date2;
    }
    return date1;
}

/**
 * Function to combine overlapping or adjacent events into a single event
 * @param {List} intervals List of events 
 * @returns A merged list of events 
 */
function mergeEvents(intervals) {
    intervals.sort((a, b) => a.start.getTime() - b.start.getTime())
    const res = [intervals[0]]
    for (let curr of intervals) {
      prev = res[res.length - 1]
      if (prev.end >= curr.start) {
        prev.end = dateMax(curr.end, prev.end)
      } else {
        res.push(curr)
      }
    }
    return res
};

/**
 * Insert the night as events in the event list by blocking off times between 8pm and 8am
 * @param {List} event_list List of existing events
 */
function blockOffNights(event_list) {
    // no events should be scheduled between 8pm and 8am, so this function makes night an event by blocking it off
    let rn = new Date();

    let today_morning_start = new Date(rn);
    today_morning_start.setHours(0);
    today_morning_start.setMinutes(0);

    let today_morning_end = new Date(rn);
    today_morning_end.setHours(8);
    today_morning_end.setMinutes(0);
    event_list.push({name: 'night', start: today_morning_start, end: today_morning_end});

    for (let i=0; i < 6; i++) {
        let night_start = new Date(rn);
        night_start.setHours(20);
        night_start.setMinutes(00);
        night_start.setDate(rn.getDate() + i);

        let night_end = new Date(rn);
        night_end.setHours(8);
        night_end.setMinutes(00);
        night_end.setDate(rn.getDate() + i + 1);

        let event = {name: 'night', start: night_start, end: night_end};
        event_list.push(event);
    }

    let last_day_night_start = new Date(rn);
    last_day_night_start.setDate(last_day_night_start.getDate() + 6);
    last_day_night_start.setHours(20);
    last_day_night_start.setMinutes(0);

    let last_day_night_end = new Date(rn);
    last_day_night_end.setDate(last_day_night_end.getDate() + 6);
    last_day_night_end.setHours(23);
    last_day_night_end.setMinutes(0);

    event_list.push({name: 'night', start: last_day_night_start, end: last_day_night_end});

}

/**
 * Parse a string in HH:MM time format
 * @param {String} chore_time_string Input string 
 * @returns A dictionary of the hours and minutes
 */
function parseChoreTime(chore_time_string) {
    const hr_str = chore_time_string[0] + chore_time_string[1];
    const min_str = chore_time_string[3] + chore_time_string[4];
    let storage_object = {};
    storage_object['hours'] = Number(hr_str);
    storage_object['minutes'] = Number(min_str);
    return storage_object;
}

/**
 * Go through the event list and get events per day
 * @param {list} event_list List of events
 */
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
    let end_time = new Date();
    end_time.setDate(end_time.getDate() + 6); 
    end_time.setHours(23);
    end_time.setMinutes(59);

    // for all elements, ensure none of them slip over the 7 days
    for(let i=0; i<event_list.length; i++) {
        let curr_event = event_list[i];
        if (curr_event.start > end_time) {
            // remove it from the list entirely
            event_list.splice(i, 1);
            i = i - 1; // reread the element at the current position

        } else if (curr_event.end > end_time) {
            // slice the event
            curr_event.end = end_time;
        }
    }

    let day_bucket = [[],[],[],[],[],[],[]];
    for (let i = 0; i < event_list.length; i++) {
        const event = event_list[i];

        if (event.start.getDay() != event.end.getDay()) {
            let event1 = {'name': new String(event.name), 'start': new Date(event.start), 'end': new Date(event.start)};
            event1.end.setHours(23);
            event1.end.setMinutes(59);

            assert(event1.end !== event.start);

            let event2 = {'name': new String(event.name), 'start': new Date(event.start), 'end': new Date(event.end)};
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

/**
 * Find an available time for a chore in a list of events for a single day
 * @param {dict} chore Chore object
 * @param {list} events List of events
 * @returns chore assigned in available time slot. null if no such time exists 
 */
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

            if (curr_event.end <= chore_start && (next_event.start.getTime() - chore_start.getTime() >= millisecond_duration)) {
                // construct the schedule
                const assigned_chore = {
                    name: chore.name,
                    start: chore_start,
                    end: chore_end
                }
                return assigned_chore;
            }

        } else {
            if (next_event.start.getTime() - curr_event.end.getTime() >= millisecond_duration) {
                let chore_start = new Date(curr_event.end);
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

/**
 * Find an available time between the list of events specifically for the days of the week specified
 * @param {dict} chore Chore object
 * @param {list} event_list List of event objects
 * @param {list} days_to_search List of days to be searched
 * @returns Chore with assigned start and end time. Null if chore could not be assigned.
 */
function findAvailableTime(chore, event_list, days_to_search) {


    // find the days to search
    let day_indices_to_search = [];
    for (let i = 0; i < days_to_search.length; i++) {
        let day = days_to_search[i];
        day_indices_to_search.push(day_index[day]);
    }

    let day_bucket = parseEventList(event_list);
    for (let index of day_indices_to_search) {
        let day_events = day_bucket[index];

        let assigned_chore = findTimeInDay(chore, day_events);
        if (assigned_chore) {
            return assigned_chore;
        }
    }

    // couldn't find any available timeslot
    return null;

}

/**
 * Go through each user and see if a chore matches or not in their schedules
 * @param {dict} chore Chore object
 * @param {list} user_list List of users
 * @param {dict} user_info Associated info for each user
 * @param {list} days_to_search List of days to search
 * @returns Chore object with associated name. Null if the chore could not be assigned.
 */
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

/**
 * Assign requested chores for a group by going through each user's calendars and finding 
 * times available to schedule chores that work in everybody's schedules and is equally
 * divided between users
 * @param {string} gid Group id
 * @returns List of assigned chores with times and people a chore is associated with
 */
async function scheduleChores(gid) {
    // caller function must take care of any errors thrown

    // get all the users
    const doc =  await RoommateGroup.find({'gid': gid});
    if (doc.length < 1) {
        throw Error("No collection with the gid exists");
    }
    const calendar = await Calendar.findOne({'gid': gid});

    const prev_scheduled_chores = calendar['scheduled_events'];
    await deleteEvents(prev_scheduled_chores);
    const chores = calendar['added_events'];

    let users = doc[0]['members'];
    let user_info = {}; // dictionary of uid -> dict {name, token, events}

    // retrieve and store user info
    for (let i = 0; i < users.length; i++) {
        const uid = users[i];
        const user = await User.findOne({'_id':uid});
        const token = user['gcal_refresh_token'];
        const name = user['name'];
        //call function that returns all events for user, and add to the dict of events
        const events = await gcalHelpers.getEvents(token);

        const curr_user_info = {
            name: name,
            token: token,
            events: events
        };

        user_info[uid] = curr_user_info;
    }

    let assigned_chores = []; // array of finalized chores
    let unassigned_chores = [];
    
    for (let chore of chores) {
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
    for (let assigned_chore of assigned_chores) {
        const assigned_user = assigned_chore['associated_with'];
        const token = user_info[assigned_user]['token'];
        const event_id = await gcalHelpers.addEvent(token, assigned_chore);
        assigned_chore['gcal_event_id'] = event_id;
    }

    // put the assignements in the db
    await Calendar.findOneAndUpdate(
        {gid: gid},
        {scheduled_events: assigned_chores},
    )

    return assigned_chores;
}

/**
 * Go through each event and delete it from the associated user's google calendar
 * @param {List} events Events to delete
 */
async function deleteEvents(events) {
    for (const event of events) {
        let uid = event.associated_with;
        let event_id = event.gcal_event_id;
        let user_info = await User.findOne({uid: uid});
        let user_token = user_info["gcal_refresh_token"];
        await gcalHelpers.deleteEvent(user_token, event_id);
    }
}

router.get('/:gid/getCalendar', async(req, res) => {
    try {
        let gid = req.params['gid'];
        console.log("gid", gid);
        let assigned_chores = await scheduleChores(gid);
        console.log("assigned chores", assigned_chores);
        res.status(200).send(assigned_chores);
    } catch(err) {
        res.status(400).json({message: err});
    }

})

module.exports = router;