// This file is to define the helper functions for routes/roommateGroup.js

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
