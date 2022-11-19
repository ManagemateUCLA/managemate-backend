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
        let task_name = req.body['title'];
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
                if (result.length <= 0) {
                    res.status(400).send({message: "No collection with id found"});
                } else {
                    res.status(200).send(result[0]['added_events']);
                }
            }
        });
    } catch (err) {
        res.json({message: err});
    }
});

module.exports = router;