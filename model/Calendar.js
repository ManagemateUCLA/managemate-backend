const string = require('@hapi/joi/lib/types/string');
const mongoose = require('mongoose');

const Chore = new mongoose.Schema(
    {
        name: {
            type: String,           // HH:MM
            required: true,
        },
        start: String,
        duration: Number,
        preferred_days: [String],
    }
)

const GCalEvent = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        start: Date,
        end: Date,
        associated_with: String, // id
        associated_with_name: String, // name of person
        gcal_event_id: String
    }
)


const calendarSchema = new mongoose.Schema(
    {
        gid: {
            type: String,
            required: true,
            unqiue: true
        },
        added_events: [Chore],
        scheduled_events: {
            type: [GCalEvent],
            default: []
        }
    }
);


module.exports = mongoose.model("Calendar", calendarSchema);
// module.exports = mongoose.model("Event", Event);