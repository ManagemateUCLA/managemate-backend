// Router Imports 
const router = require("express").Router();

// Model Imports 
const RoommateGroup = require('../model/RoommateGroup');
const User = require('../model/User');
const Transaction = require('../model/Transaction');

// Local files import
const constants = require('../constants');
const verify = require("./verifyJWTToken");
const helpers = require("../helpers/general.js");
// External Libraries
const { response } = require('express');

// Endpoints 

/**
 * POST
 * Add a new expense or record a payment/settlement
 */
router.post("/recordTransaction", async (req, res) => {
    // create the transaction object
    const transaction = new Transaction({
        title: req.body.title,
        amount: req.body.amount,
        lender: req.body.lender,
        borrowers: req.body.borrowers,
        date: req.body.date,
        gid: req.body.gid,
        isProcessed: req.body.isProcessed
    });

    // sanity checks

    // check if gid exists     
    const gidExist = await RoommateGroup.findOne({ gid: req.body.gid });

    if(!gidExist)
        return res.status(400).send("Invalid gid!"); 

    // check if the lender/borrowers exist in the group 
    let members = req.body.borrowers;
    members.push(req.body.lender);

    console.log("Members", members);

    for (let i = 0; i < members.length; i++) {
        isUserInGroup = await helpers.checkUserInGroup(req.body.gid, members[i]);
        if(!isUserInGroup)
        {
            return res.status(400).send("Invalid Members: One of the lenders or borrowers are not in the specified group!"); 
        }
    }

    // check if lenders and borrowers exist in the given gid
    console.log(gidExist);
    
    try {
        // Add transaction to Transaction table
        const savedTransaction = await transaction.save();
        res.status(200).send("Recorded Transaction Successfully");
    } catch (err) {
        res.status(400).send(err);
    }
});

module.exports = router;