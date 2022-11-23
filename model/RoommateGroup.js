const mongoose = require('mongoose');

const Event = new mongoose.Schema(
    {
        discordUserId: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        }

    }
)

const roomateGroupSchema = new mongoose.Schema(
    {
        discordServerId: {
            type: String,
            required: false,
            default: ""
        },

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
        },
        bulletinBoard: {
            type: [Event],
            required: false,
            default: []
        }
    }
);

module.exports = mongoose.model('RoommateGroup', roomateGroupSchema);