// creating a router 
const router = require("express").Router();
const RoommateGroup = require('../model/RoommateGroup');
const User = require('../model/User');
const constants = require('../constants');
const helpers = require('../helpers/general');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
    response
} = require('express');
const verify = require("./verifyJWTToken");
var axios = require('axios');
var qs = require('qs');
const gCal = require('../helpers/googleCal');
let querystring = require('querystring');

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
    try {
        const code = req.body.code;
        const uid = req.user._id;
        const client_id = process.env.CLIENT_ID;
        const client_secret = process.env.CLIENT_SECRET;
        const redirect_uri = process.env.REDIRECT_URI;
        let data = {
            client_id: client_id,
            client_secret: client_secret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirect_uri
        };
        let url = 'https://oauth2.googleapis.com/token';
        let response = await axios.post(url, querystring.stringify(data), {
            headers: {
                'content-Type': 'application/x-www-form-urlencoded'
            }
        });
        let response_data = response.data;

        if (response_data.hasOwnProperty("refresh_token")) {

            let refresh_token = response_data.refresh_token;
            try {
                let resp = await User.findOneAndUpdate({
                    _id: uid
                }, {
                    gcal_refresh_token: refresh_token
                }, );
            } catch (err) {
                res.status(400).send(err);
                return;
            }
            res.status(200).send("successfully added refresh token");
            return;
        } else {
            res.status(404).send("no refresh token in body - already registered with google calendar");
            return;
        }

    } catch (err) {
        res.status(400).send("unknown connection error");
        return;
    }
});

router.get('/checkUserInGroup', verify, async (req, res) => {
    try {
        let userinfo = await User.findOne({
            _id: req.user._id
        });
        let gid = userinfo.gid;
        if (!gid)
            return res.status(200).send({
                gid: null
            });
        console.log(gid);
        return res.status(200).send({
            gid: gid
        });
    } catch (err) {
        return res.status(400).send({
            message: err
        });
    }
});
module.exports = router;