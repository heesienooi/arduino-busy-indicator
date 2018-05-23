const {listEvents} = require('./lib/calendar');

listEvents(function (err, events) {
  console.log(events);
});
