const string = require('@hapi/joi/lib/types/string');
const mongoose = require('mongoose');

const Event = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        day: String,
        start_time: String,
        duration: Number,
        preferred_days: [String],
        associated_with: String, // id
        associated_with_name: String // name of person
    }
)


const calendarSchema = new mongoose.Schema(
    {
        gid: {
            type: String,
            required: true,
            unqiue: true
        },
        added_events: [Event],
        scheduled_events: {
            type: [Event],
            default: []
        }
    }
);


module.exports = mongoose.model("Calendar", calendarSchema);
// module.exports = mongoose.model("Event", Event);