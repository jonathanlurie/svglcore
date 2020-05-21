/**
 * In this webworker, we send a message to the main thread every half second
 */

// the worker code lies in the export instruction
function Bar(self) {

  setInterval(function () {
    self.postMessage('A message sent by the worker on a regular interval')
  }, 500)

  self.addEventListener('message',function (e) {
    console.log(e.data)
    self.postMessage('PONG from worker')
  })
}

module.exports = Bar
