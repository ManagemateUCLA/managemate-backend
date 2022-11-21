const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');


async function loadSavedCredentialsIfExist(userTokenJSON) {
    try {
      return google.auth.fromJSON(userTokenJSON);
    } catch (err) {
      return null;
    }
}


module.exports.getEvents = async (userTokenJSON) => {
    let auth = await loadSavedCredentialsIfExist(userTokenJSON);
    if (!auth) {
        console.log("auth token issue");
        return;
    }

    const calendar = google.calendar({version: 'v3', auth});
    let timeMin = new Date();
    let timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 7);

    const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
    });

    const events = res.data.items;
    if (!events || events.length === 0) {
        console.log('No upcoming events found.');
        return;
    }

    events.forEach((ele, index) => {
        let startDate = new Date(ele.start.dateTime);
        let endDate = new Date(ele.end.dateTime);
        mongoEvent = {
            name: ele.summary,
            start: startDate,
            end: endDate
        }
        events[index] = mongoEvent
    })
    return events
}


module.exports.addEvent = async (userTokenJSON, event) => {
    let auth = await loadSavedCredentialsIfExist(userTokenJSON);
    if (!auth) {
        console.log("auth token issue");
        return;
    }

    const calendar = google.calendar({version: 'v3', auth});
    const event = {
        'summary': event.name,
        'start': {
        'dateTime': event.start.toISOString(),
        'timeZone': 'America/Los_Angeles',
        },
        'end': {
        'dateTime': event.end.toISOString(),
        'timeZone': 'America/Los_Angeles',
        },
    }
   
    let response = await calendar.events.insert({
        auth: auth,
        calendarId: 'primary',
        resource: event,
    })

    let eventID = response.data.id;
    return eventID;
}

module.exports.deleteEvent = async (userTokenJSON, eventID) => {
    let auth = await loadSavedCredentialsIfExist(userTokenJSON);
    if (!auth) {
        console.log("auth token issue");
        return;
    }

    const calendar = google.calendar({version: 'v3', auth});
    let resp = await calendar.events.delete({
      auth: auth,
      calendarId: 'primary',
      eventId: eventID
    });

    return true;
}




