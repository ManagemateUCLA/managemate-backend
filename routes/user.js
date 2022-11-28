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
var axios = require('axios');
var qs = require('qs');
const gCal = require('../helpers/googleCal');

/**
 * * Inserts Google Calendar API token for the User
 * * Takes JWT, and auth_code in POST body
 */

// router.post('/testingGCalAdditions', async (req, res) => {
//     let refresh_token = "1//06B10G7obhZaCCgYIARAAGAYSNwF-L9IrjUUTJ3F_v_fA_MKxtHHciXDYLWpkho3kg6cs2RZZNQQT_gjN-GBwnf3fk_8q6KTMldk";
//     let timeMax = new Date();
//     timeMax.setHours(0,0,0,0);
//     timeMax.setDate(timeMax.getDate() + 1);

//     mongoEvent = {
//         name: "sexy_times",
//         start: timeMax,
//         end: timeMax
//     }
//     let resp = await gCal.addEvent(refresh_token, mongoEvent);
//     console.log(resp)
//     resp = await gCal.getEvents(refresh_token);
//     res.status(200).send(resp);

// })

 router.post('/addToken', verify, async (req, res) => {
    try{
        
        const code = req.body.code;
        const uid = req.user._id;
        const client_id = process.env.CLIENT_ID;
        const client_secret = process.env.CLIENT_SECRET;
        const redirect_uri = process.env.REDIRECT_URI;
        
        var data = qs.stringify({
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri 
          });
          var config = {
            method: 'post',
            url: 'https://oauth2.googleapis.com/token',
            headers: { 
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            data : data
          };
          
          axios(config)
          .then(function (response) {
            let response_data = JSON.stringify(response.data);
            console.log(response_data);
            if (response_data.refresh_token !== null) {
                try {
                    let refresh_token = response_data.refresh_token;
                    User.findOneAndUpdate(
                        {_id: uid}, 
                        {gcal_refresh_token: refresh_token},
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

                } catch(err) {
                    res.status(400).send(err);
                }
            }
            else {
                res.status(400).send({"error": "wrong params or pre-existing refresh_token"});
            }
          })
          .catch(function (error) {
            console.log(error);
            res.status(404).send(error);
          });
    }
    catch(err) {
        res.status(400).send(json({message: err}));
    }
});

router.get('/checkUserInGroup', verify, async (req, res) => {
    try {
        let userinfo = await User.findOne({_id: req.user._id});
        let gid = userinfo.gid;
        if (!gid)
            return res.status(200).send({gid: null});
        console.log(gid);
        return res.status(200).send({gid: gid});
    } catch(err) {
        return res.status(400).send({message: err});
    }
});
module.exports = router;