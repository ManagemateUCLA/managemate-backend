const RoommateGroup = require('../model/RoommateGroup');
const User = require('../model/User');

/**
 * * Checks if a user is in a given group id
 * @param gid group id of group we are interested in
 * @param uid user id of user we are interested in
 * @return {Boolean} to describe whether a user is in a group or not
 */

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
 * * Provides group id from a given discord server id
 * @param discordServerId discord server id of group we are interested in
 * @return {String} with gid and null in error case
 */

module.exports.getGroupId = async (discordServerId) => {
    try {
        let roommateGroup = await RoommateGroup.findOne({discordServerId: discordServerId});
        if (!roommateGroup)
            return null
        let gid = roommateGroup.gid;
        console.log(gid);
        return gid;
    } catch(err) {
        return null;
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


/**
 * * Checks if a user is in a given group id
 * @param discordServerId discord server id of group we are interested in
 * @param discordUserId discord user id of user we are interested in
 * @return {Boolean} to describe whether a user is in a group or not
 */

module.exports.checkDiscordUserInDiscordServer = async (discordServerId, discordUserId) => {
    try {
        let roommateGroup = await RoommateGroup.findOne({discordServerId: discordServerId});
        if (!roommateGroup)
            return false
        let members = roommateGroup.members;
        console.log("members", members);
        let userObject = await User.findOne({discordUserId: discordUserId});
        let uid = userObject._id;
        console.log("uid", uid);
        return members.includes(uid);
    } catch (err) {
        return false;
    }
}

/**
 * * Provides name id from a given discord user id
 * @param discordUsername discord user id of person we are interested in
 * @return {String} with name of the user and null in error case
 */

module.exports.getNameFromDiscordUsername = async (discordUsername) => {
    try {
        let userInfo = await User.findOne({discordUserId: discordUsername});
        return userInfo["name"];

    } catch(err) {
        return null;
    }
}
