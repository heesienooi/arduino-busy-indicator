const moment = require('moment');
const {listEvents} = require('./lib/calendar');
const five = require("johnny-five");
const board = new five.Board();

const SECOND = 1000;
const MIN = SECOND * 60;
const HOUR = MIN * 60;

const DEFAULT_OPTIONS = {
  autoSync: true,
  workStartTime: '8:00',
  workEndTime: '18:00',
}

const TEST_TIME_BLOCKS_DATA = [
  {start: moment().add(5, 's'), end: moment().add(10, 's')},
  {start: moment().add(15, 's'), end: moment().add(20, 's')}
]

function inTimeRange(startTime, endTime) {
  const now = moment();
  const start = moment(startTime);
  const end = moment(endTime);
  if (now >= start && now < end) {
    // Happening now
    return true;
  }
  return false;
}

class MainController {
  constructor(options) {
    this.timeBlocks = TEST_TIME_BLOCKS_DATA;
    this.activeTimeBlock = false;
    this.led = new five.Led(13);

    if (options.autoSync) {
      this.autoSync();
    }

    // Starting the interval to setBusy
    this.start();

    // Fix `this` in the methods sharing with REPL
    this.sync = this.sync.bind(this);
    this.setBusy = this.setBusy.bind(this);
    this.setFree = this.setFree.bind(this);
  }

  start() {
    let seconds = 0;
    setInterval(() => {
      console.log(++seconds);

      // Currently, timeblock activated
      if (this.activeTimeBlock) {
        const currentTimeBlock = this.timeBlocks[0];
        if (inTimeRange(currentTimeBlock.start, currentTimeBlock.end)) {
          // Now still within timeblock, return
          return;
        }
        // When timeblock end
        this.activeTimeBlock = false;
        this.setFree();
        // Remove the timeblock
        this.timeBlocks.shift();
      }

      // No blocks to process, return
      if (this.timeBlocks.length <= 0) return;

      // Look for upcoming timeblock
      const upcomingTimeBlock = this.timeBlocks[0];
      console.log('upcomingTimeBlock', upcomingTimeBlock);
      if (inTimeRange(upcomingTimeBlock.start, upcomingTimeBlock.end)) {
        this.activeTimeBlock = true;
        this.setBusy();
      }
    }, 1 * SECOND);
  }

  autoSync() {
    this.sync();
    setInterval(() => {
      const now = moment();
      const start = moment(this.options.workStartTime, 'HH:mm');
      const end = moment(this.options.workEndTime, 'HH:mm');

      // Only allow interval to fire sync inside working hours.
      if (now >= start && now < end) {
        this.sync();
      }
    }, 1 * HOUR);
  }

  setBusy() {
    console.log('setBusy');
    this.led.on();
  }

  setFree() {
    console.log('setFree');
    this.led.off();
  }

  sync() {
    // Only sync now & upcoming events
    // call google calendar sync
    listEvents((err, events) => {
      if (err) return console.error('Calendar API error: ', err);
      this.timeBlocks = events;
    })
  }
}

board.on("ready", function() {
  // Initialize controller
  const controller = new MainController(DEFAULT_OPTIONS);

  // Allow controls in REPL
  this.repl.inject({
    _controller: controller,
    sync: controller.sync,
    setBusy: controller.setBusy,
    setFree: controller.setFree,
  });
});
