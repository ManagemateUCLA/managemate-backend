// This file is to define the helper functions for routes/roommateGroup.js

const RoommateGroup = require('../model/RoommateGroup');
const User = require('../model/User');

module.exports.checkUserInGroup = async (gid, uid) => {
    try {
        let roommateGroup = await RoommateGroup.findOne({gid: gid});
        if (!roommateGroup)
            return false
        let members = roommateGroup.members;
        console.log(members);
        return members.includes(uid);
    } catch(err) {
        return false;
    }
}

/**
 * * Helper method - creates random string 
 * @param len Length of the random string 
 * @param arr Source of the randomly generated string  
 */

module.exports.randomStr = function (len, arr) {
    var ans = '';
    for (var i = len; i > 0; i--) {
        ans += 
          arr[Math.floor(Math.random() * arr.length)];
    }
    return ans;
}

module.exports.checkDiscordUserInDiscordServer = async (discordServerId, discordUserId) => {
    try {
        let roommateGroup = await RoommateGroup.findOne({discordServerId: discordServerId});
        if (!roommateGroup)
            return false
        let members = roommateGroup.members;
        console.log(members);
        let userObject = await User.findOne({discordUserId: discordUserId});
        let uid = userObject._id;
        return members.includes(uid);
    } catch (err) {
        return false;
    }
}
