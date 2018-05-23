const moment = require('moment');

const now = moment();
const start = moment('00:00', 'HH:mm');
const end = moment('18:00', 'HH:mm');;
// Only allow interval to fire sync inside working hours.
if (now >= start && now < end) {
  console.log('Yeah');
}

function* idMaker() {
  var index = 0;
  while(index < 2)
    yield index++;
}

var gen = idMaker();

console.log(gen.next()); // 0
console.log(gen.next()); // 1
console.log(gen.next()); // 2


function* loop(array) {
  var index = 0;
  array.pop();
  while (index < array.length) {
    yield array[index++];
  }
}

var gen = loop([1, 2, 3]);
console.log(gen.next()); // 0
console.log(gen.next()); // 1
console.log(gen.next()); // 2
console.log(gen.next()); // 2
