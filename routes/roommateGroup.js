// creating a router 
const router = require("express").Router();
const RoommateGroup = require('../model/RoommateGroup');
const User = require('../model/User');
const verify = require("./verifyJWTToken");

// GET group details 
router.get('/', verify, async (req, res) => {
    try{
        console.log(req.user._id);
        const userObject = await User.findById(req.user._id);
        console.log(userObject);
        // const groupId = userObject.gid;

        // if(!groupId) {
        //     res.status(400).send("You are not added in any Group");
        //     return;
        // }

        // const groupObject = await RoommateGroup.findOne({gid: groupId},  function (err, docs) {
        //     if (err) {
        //         console.log(err);
        //     }
        //     else{
        //         console.log("Result : ", docs);
        //     }
        // });
        res.send(userObject);
    }
    catch(err){
        res.json({message: err});
    }
});

module.exports = router;