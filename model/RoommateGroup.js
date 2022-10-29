const mongoose = require('mongoose');

const roomateGroupSchema = new mongoose.Schema(
    {
        gid: {
            type: String,
            required: true,
            unqiue: true
        },
        name: {
            type: String,
            required: true,
            min: 3,
            max: 255
        },
        members: {
            type: [String],
            required: true,
            max: 16,
            min: 1
        },
        discordlink: {
            type: String,
            required: false,
            min: 1,
            max: 128
        }
    }
);

module.exports = mongoose.model('RoommateGroup', roomateGroupSchema);