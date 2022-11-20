const mongoose = require('mongoose');

const bulletinBoardEventSchema = new mongoose.Schema(
    {
        uid: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true
        }
    }
)

const roommateGroupSchema = new mongoose.Schema(
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
        },
        bulletinBoard: {
            type: [bulletinBoardEventSchema],
            default: []
        }
    }
);

module.exports = mongoose.model('RoommateGroup', roommateGroupSchema)
