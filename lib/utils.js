const moment = require('moment');

module.exports = {
  inTimeRange: function (startTime, endTime) {
    const now = moment();
    const start = moment(startTime);
    const end = moment(endTime);
    if (now >= start && now < end) {
      // Happening now
      return true;
    }
    return false;
  },

  testTimeBlocksData: [
    {start: moment().add(5, 's'), end: moment().add(10, 's')},
    {start: moment().add(15, 's'), end: moment().add(20, 's')},
  ]
}
