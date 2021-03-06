const moment = require('moment');
const {listEvents} = require('./lib/calendar');
const {inTimeRange, testTimeBlocksData} = require('./lib/utils');
const five = require("johnny-five");
const board = new five.Board();

const SECOND = 1000;
const MIN = SECOND * 60;
const HOUR = MIN * 60;

const DEFAULT_OPTIONS = {
  autoSync: true,
  workStartTime: '08:00',
  workEndTime: '18:00',
  interval: 1 * MIN,
  autoSyncInterval: 2 * HOUR,
}

class ServoController {
  constructor() {
    this._min = 10;
    this._max = 153;
    this._speed = 1000;
    this._servo = new five.Servo({
      pin: 10,
      range: [this._min, this._max],
      startAt: this._min,
    });
  }

  min() {
    this._servo.to(this._min, this._speed);
  }

  max() {
    this._servo.to(this._max, this._speed);
  }

  to(degrees, speed = this.speed, steps = 0) {
    this._servo.to(degrees, speed, steps);
  }
}

class MainController {
  constructor(options) {
    this.options = options;
    this.timeBlocks = testTimeBlocksData;
    this.activeTimeBlock = false;

    this.led = new five.Led(13);
    this.servo = new ServoController();

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

      // No blocks to process, return
      if (this.timeBlocks.length <= 0) {
        if (this.activeTimeBlock) {
          this.activeTimeBlock = false;
          this.setFree();
        };
        return;
      };

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

      // Look for upcoming timeblock
      const upcomingTimeBlock = this.timeBlocks[0];
      console.log('upcomingTimeBlock', upcomingTimeBlock);
      if (inTimeRange(upcomingTimeBlock.start, upcomingTimeBlock.end)) {
        this.activeTimeBlock = true;
        this.setBusy();
      }
    }, this.options.interval);
  }

  autoSync() {
    this.sync();
    setInterval(() => {
      if (inTimeRange(
        moment(this.options.workStartTime, 'HH:mm'),
        moment(this.options.workEndTime, 'HH:mm')
      )) {
        // Only allow interval to fire sync inside working hours.
        this.sync();
      }
    }, this.options.autoSyncInterval);
  }

  setBusy() {
    console.log('setBusy');
    this.led.brightness(10);
    this.servo.max();
  }

  setFree() {
    console.log('setFree');
    this.led.off();
    this.servo.min();
  }

  sync() {
    console.log('sync');
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
