const net = require('net');
const EverSocket = require('eversocket').EverSocket;
const WebSocket = require('ws')
const ReconnectingWebSocket = require('reconnecting-websocket');
const url = 'ws://192.168.0.40:8000/ws'

// contruct holder for mod time state
const active = {
	mod: 0,
}

// contruct connection options for xtra beacon
const options = {
	moxaIpAddress: '192.168.0.180',
	moxaPort: 23,
}

// construct websocket stream options
const suboptions = {
  "topic": "subscribe",
  //"data": ['run.scoreboard', 'run.timer']
  // "data": ['run.scoreboard']
  "data": ['run.timer']
}

// proxy to monitor the time state and send once on state change to enable disable the beacon
const modProxy = new Proxy(active, {
  set: function (target, key, value){
    
       console.log(`${key} set from ${active.mod} to ${value}`);
       if ((active.mod==0) && (value==1)){
        console.log('turning on')
        sendnewData('#0:2\\MOD1')
       }

       if ((active.mod==1) && (value==0)){
        console.log('turning off')
        sendnewData('#0:2\\MOD0')
       }
       
target[key] = value;
return true; 
},
});


// reconnecting websocket 

//rws = new ReconnectingWebSocket(`ws://192.168.0.40:8000/ws`);
rws = new ReconnectingWebSocket(url, undefined, {
  WebSocket,
  maxRetries: 0,
})

rws.addEventListener('open', () => {
  console.log('Connected')
  this.isConnected = true
  //this.subscribe()
  rws.send(JSON.stringify(suboptions))
  //rws.send(JSON.stringify({ topic: 'run', data: {test: 'here'}}));
})
rws.addEventListener('close', () => {
  console.log('Close')
  this.isConnected = false
})
rws.addEventListener('error', (err) => {
  console.log('Error', err)
})
rws.addEventListener('message', (message) => {
  console.log("incoming");
  const { topic, data } = JSON.parse(message.data)
  console.log(data.payload.elapsed_under_racing.remaining)
  const currentTime = (data.payload.elapsed_under_racing.remaining)
 

  if (currentTime >= "60000" ){
   modProxy.mod=0;
    // sendnewData('#0:2\\MOD0')
    
  }
  if (currentTime <= "59999" ){
    modProxy.mod=1;
    // sendnewData('#0:2\\MOD1')
      }
})


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
  dhSocket.connect(options.moxaPort, options.moxaIpAddress);
  

  