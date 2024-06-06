const net = require('net');
const EverSocket = require('eversocket').EverSocket;
const WebSocket = require('ws')
const ReconnectingWebSocket = require('reconnecting-websocket');
const jsonfile = require('jsonfile');
const path = 'settings.json';
//const url = 'ws://192.168.0.40:8000/ws'

//contruct connection options for xtra beacon
// const options = {
//  moxaIpAddress: '192.168.0.1',
// 	moxaPort: 23,
//}

//read the settings file and store variable settings
const settings=jsonfile.readFileSync(path)
console.log("Current Settings","beacon",settings.beaconIp,"url",settings.url)


// construct websocket stream options
const suboptions = {
  "topic": "subscribe",
  //"data": ['run.scoreboard', 'run.timer']
  // "data": ['run.scoreboard']
  "data": ['run.timer']
}

// reconnecting websocket 

//rws = new ReconnectingWebSocket(`ws://192.168.0.40:8000/ws`);
rws = new ReconnectingWebSocket(settings.url, undefined, {
  WebSocket,
  maxRetries: 0,
})

rws.addEventListener('open', () => {
  console.log('Connected')
  this.isConnected = true
  rws.send(JSON.stringify(suboptions))
  })
rws.addEventListener('close', () => {
  console.log('Close')
  this.isConnected = false
})
rws.addEventListener('error', (err) => {
  console.log('Error', err)
})
rws.addEventListener('message', onVolareMsg) // Links to function below

const ABOVE_1MIN_REMAIN = '#0:2\\MOD0'
const BELOW_1MIN_REMIAN = '#0:2\\MOD1'
let lastCommandSent = null // Tracks the last command sent so that we do not resend

function onVolareMsg(message) {
  try {
    const { data } = JSON.parse(message.data)
    const timeRemaining = data.payload.elapsed_under_racing.remaining
  
    if (timeRemaining >= 60_000 && lastCommandSent !== ABOVE_1MIN_REMAIN) {
      sendnewData(ABOVE_1MIN_REMAIN)
      lastCommandSent = ABOVE_1MIN_REMAIN
    }
    if (timeRemaining < 60_000 && lastCommandSent !== BELOW_1MIN_REMIAN) {
      sendnewData(BELOW_1MIN_REMIAN)
      lastCommandSent = BELOW_1MIN_REMIAN
    }
  } catch (e) {
    console.error(`Error processing Volare message: ${e}`, e)
  }
}

// send the command through to xtra beacon with params
function sendnewData(cmd){

    dhSocket.write((cmd) + '\r' + '\n', function(err) {
    if (err) {
      return console.log('Error on write: ', err.message)
    }
    console.log('message written' + (cmd))
  })
  
  // Open errors will be emitted as an error event
  dhSocket.on('error', function(err) {
    console.log('Error: ', err.message)
  })

}

// Connect to Xtra Beacon 
const dhSocket = new EverSocket({
    reconnectWait: 1000,      // wait 100ms after close event before reconnecting
    timeout: 5000,            // set the idle timeout to 100ms
    reconnectOnTimeout: false // reconnect if the connection is idle
    
  });

  dhSocket.setEncoding('utf8');

  dhSocket.on('reconnect', function() {
    console.log('The Beacon socket reconnected following a close or timeout event');
  });
  dhSocket.on('error', function(err) {
    console.log('The Beacon socket returned an error');
      console.log(err);
  });
  // dhSocket.on('close', function() {
  //   console.log('Moxa connection "close" received');
  //     process.exit(1);
  // });
  dhSocket.on('connect', function() {
    console.log('Connected to Beacon');
    sendnewData('#0:2\\MOD0'); // send inital OFF state to xtra beacon need esc chr for M
  });
    //listen for reply after sending
  dhSocket.on('data', function (data) {
      // var buff = Buffer.from(data).toString(); // get buffer and convert to string
      console.log('reply: ', data)
  
  })

    // dhSocket.connect(options.moxaPort, options.moxaIpAddress);
  dhSocket.connect(settings.beaconPort, settings.beaconIp);
  
  

