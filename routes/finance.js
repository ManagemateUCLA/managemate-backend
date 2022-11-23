// Router Imports 
const router = require("express").Router();

// Model Imports 
const RoommateGroup = require('../model/RoommateGroup');
const User = require('../model/User');
const Transaction = require('../model/Transaction');
const BalanceTable = require('../model/BalanceTable');
const { accountsSchema } = require('../model/BalanceTable');

// Local files import
const constants = require('../constants');
const verify = require("./verifyJWTToken");
const generalHelpers = require("../helpers/general.js");
const financeHelpers = require("../helpers/finance.js");
// External Libraries
const { response } = require('express');

// Endpoints 

/**
 * POST
 * Add a new expense or record a payment/settlement
 */
router.post("/recordTransaction", async (req, res) => {
    /*
        {
            "title": <TRANSACTION_TITLE>,
            "amount": <TRANSACTION_AMOUNT>,
            "lender": <TRANSACTION_LENDER>,
            "borrowers": [<TRANSACTION_BORROWER>, ],
            "gid": <GROUP_ID>
        }
    */

    // get some objects from the body 
    const lender = req.body.lender;
    const borrowers = req.body.borrowers;
    const amount = req.body.amount;
    const gid = req.body.gid;

    // create the transaction object
    const transaction = new Transaction({
        title: req.body.title,
        amount: amount,
        lender: lender,
        borrowers: borrowers,
        date: req.body.date,
        gid: gid,
    });

    // sanity checks

    // check if gid exists     
    const gidExist = await BalanceTable.findOne({ gid: gid });

    if(!gidExist)
        return res.status(400).send("Invalid gid!"); 

    // check if the lender/borrowers exist in the group 
    let members = borrowers;
    members.push(lender);

    console.log("Members", members);

    let spendingTable = gidExist.table;
    for (let i = 0; i < members.length; i++) {
        if(!spendingTable.has(members[i]))
        {
            return res.status(400).send("Invalid Members: One of the lenders or borrowers are not in the specified group!"); 
        }
    }

    let simplifiedSpendingTable = financeHelpers.simplifyDebts(spendingTable, lender, borrowers, amount, "add");
    try {
        const updated = await BalanceTable.replaceOne({ gid: gid }, { table: simplifiedSpendingTable });
        if (!updated) return res.status(401).send("User is not updated");
    } catch (err) {
        res.status(400).send(err);
    }
    

    try {
        // Add transaction to Transaction table
        const savedTransaction = await transaction.save();
        res.status(200).send({tid:savedTransaction._id});
    } catch (err) {
        res.status(400).send(err);
    }
});

/**
 * DELETE 
 * Deletes a transaction provided the transaction id 
 */
router.delete("/deleteTransaction", async (req, res) => {
    /*
        {
            "tid": <TRANSACTION_ID>
        }
    */
   let tid = req.body.tid;
    try {
        // check if tid exists     
        const tidExist = await Transaction.findOne({ "_id": tid });

        if(!tidExist)
            return res.status(400).send("Invalid tid!"); 
        
        // get some objects from the body 
        const lender = tidExist.lender;
        const borrowers = tidExist.borrowers;
        const amount = tidExist.amount;
        const gid = tidExist.gid;

        // check if gid exists     
        const gidExist = await BalanceTable.findOne({ gid: gid });

        if(!gidExist)
            return res.status(400).send("Invalid gid!"); 

        let spendingTable = gidExist.table;
        let simplifiedSpendingTable = financeHelpers.simplifyDebts(spendingTable, lender, borrowers, amount, "delete");
        try {
            const updated = await BalanceTable.replaceOne({ gid: gid }, { table: simplifiedSpendingTable });
            if (!updated) return res.status(401).send("User is not updated");
        } catch (err) {
            res.status(400).send(err);
        }

        let deleteTransaction = await Transaction.deleteOne( { "_id" : tid } );
        console.log(deleteTransaction);
        res.status(200).send("Deleted Successfully");
    } catch(err) {
        console.log(err);
        res.status(400).send(err);
    }
});

/**
 * GET 
 * Gets all transactions of a a given group as a sorted list
 */
 router.get("/getTransactions", async (req, res) => {
    /*
        {
            "gid": <GROUP_ID>
        }
    */
   let gid = req.body.gid;
   try {
        transactions = await RoommateGroup.find({gid: gid});
        console.log(transactions);
        res.status(200).send(transactions);
   } catch (err) {
        res.status(400).send(err);
   }
});


router.post("/addMember", async (req, res) => {
    /*
        {
            "gid": <GROUP_ID>,
            "members": [<USER_ID>,]
        }
    */
    let gid = req.body.gid;
    let members = req.body.members;
    try {
        let balanceTableEntry = await BalanceTable.findOne({gid: gid});
        console.log("Balance Table:", balanceTableEntry);       
        if(!balanceTableEntry)
        {
            return res.status(400).send("No spending account found with the provided gid");
        }

        let balanceTable = balanceTableEntry.table;
        for(let i = 0; i < members.length; i++) {
            balanceTable.set(members[i], new Map());
        }
        console.log(balanceTable);
        let updatedTable = await BalanceTable.findOneAndUpdate({gid: gid}, {table: balanceTable});
        return res.status(200).send("Updated successfully");
    } catch (err) {
        console.log("Couldn't add members to finance account", err);
        return res.status(400).send(err);
    }
});


router.post("/createSpendingGroup", async (req, res) => {
    /*
        {
            "gid": <GROUP_ID>
        }
    */
    let gid = req.body.gid;
    try {
        // check if the newly generated gid exists 
        let spendingGroupExists = await BalanceTable.findOne({gid: gid});

        if(spendingGroupExists) {
            return res.status(400).send("A spending group exists with the provided gid");
        }
        let newSpendingGroup  = new BalanceTable({
            gid: gid,
            table: {}
        }); 

        console.log(newSpendingGroup);
    
        // save the newly created group
        try {
            const savedGroup = await newSpendingGroup.save();
            return res.status(200).send("Spending Group created succesfully");
        } catch(err) {
            // save failed: MongoDB error
            return res.status(400).send("Could not create spending group");
        }
    } catch (err) {
        return res.status(400).send("Failed to fetch spending group");
    }
});

router.get("/getBalance", async (req, res) => {
    let gid = req.body.gid;
    try {
        // check if the newly generated gid exists 
        let spendingGroupExists = await BalanceTable.findOne({gid: gid});

        if(!spendingGroupExists) {
            return res.status(400).send("A spending group with the provided gid does not exist");
        }
        
        return res.status(200).send(spendingGroupExists.table);
    } catch (err) {
        return res.status(400).send("Could not get the Spending Table");
    }
});

router.post("/test", async (req, res) => {
    const map1 = new Map();

    map1.set('a', 1);
    map1.set('b', 2);
    map1.set('c', 3);

    const table = new BalanceTable({
        gid: 'ABHSK',
        table: {
            user1: map1,
            user2: map1
        }
    });

//     try {
//         tables = await table.save();
//         console.log(tables);
//         res.status(200).send(tables);
//    } catch (err) {
//         res.status(400).send(err);
//    }

    try {
        // transactions = await BalanceTable.find({_id: "637aabcd51efed18c9c35a6d"});
        // let table = transactions[0].table;
        // let user1 = table.get("user1");
        // user1["a"] = 5;
        // console.log(user1);
        // table.set("user1", user1);
        // console.log(table);
        // await BalanceTable.findOneAndUpdate({_id: "637aabcd51efed18c9c35a6d"}, {table: table});
        // transactions = await BalanceTable.find({_id: "637aabcd51efed18c9c35a6d"});
        // console.log(user1["a"]);
        // res.status(200).send(transactions);
    } catch (err) {
        res.status(400).send(err);
    }
});

module.exports = router;