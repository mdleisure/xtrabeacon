const net = require('net');
const EverSocket = require('eversocket').EverSocket;
const WebSocket = require('ws')
//const rws = require('reconnecting-websocket')
const ReconnectingWebSocket = require('reconnecting-websocket');
const url = 'ws://192.168.0.40:8000/ws'
//const connection = new WebSocket(url)

const options = {
	// moxaIpAddress: '192.168.0.193',
  moxaIpAddress: '192.168.0.180',
	moxaPort: 23,
	//ledUpdateInterval: 3000,
}

const suboptions = {
  "topic": "subscribe",
  //"data": ['run.scoreboard', 'run.timer']
  "data": ['run.scoreboard']
}

// reconbnecting websocket 

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
        //console.log({ topic, data })
        console.log(data.state)
        //console.log(data.meta.win_by)
        console.log(data.meta.auto_start_run_on)
  const currentstate = (data.state)
  //const racetype = (data.meta.win_by)
  const assignby = (data.meta.auto_start_run_on)


  if (currentstate == "YELLOW" ){
    // sendnewData('#255:2 /S685082:126 +A \\LST1')
    sendnewData('#0:2\\MOD0')
  }
  if (currentstate == "GREEN" ){
    // sendnewData('#255:2 +A \\LST4')
    sendnewData('#0:2\\MOD1')

    
  }

  // if (currentstate == "PURPLE"){
  //   sendnewData('#255:2 +A \\LST3')
  // }

  // if (currentstate == "RED" && assignby =="MANUAL"){
  //   sendnewData('R09')
  // }

  // if (currentstate == "STOP"){
  //   //sendnewData('R08')
  //   sendnewData('R00')
  // }
})


/*
//connect websocket
connection.onopen = () => {
  console.log("on open connection sending " + (JSON.stringify(suboptions)));
  connection.send(JSON.stringify(suboptions)) 
}

connection.onmessage = (message) => {
    console.log("incoming");
    const { topic, data } = JSON.parse(message.data)
          //console.log({ topic, data })
          console.log(data.state)
          //console.log(data.meta.win_by)
          console.log(data.meta.auto_start_run_on)
    const currentstate = (data.state)
    //const racetype = (data.meta.win_by)
    const assignby = (data.meta.auto_start_run_on)


    if (currentstate == "GREEN" && assignby =="MANUAL"){
      sendnewData('R0C')
    }

    if (currentstate == "PURPLE" && assignby =="MANUAL"){
      sendnewData('R11')
    }

    if (currentstate == "RED" && assignby =="MANUAL"){
      sendnewData('R09')
    }

    if (currentstate == "STOP"){
      //sendnewData('R08')
      sendnewData('R00')
    }
}

connection.onerror = (error) => {
  console.log(`WebSocket error: ${error}`)
  }

*/



function sendnewData(cmd){
  //const cmd = 'r11'
  // moxaSocket.write('\n' +(cmd) +'\r', function(err) {
    moxaSocket.write((cmd) + '\r' + '\n', function(err) {
    if (err) {
      return console.log('Error on write: ', err.message)
    }
    console.log('message written' + (cmd))
  })
  
  // Open errors will be emitted as an error event
  moxaSocket.on('error', function(err) {
    console.log('Error: ', err.message)
  })

}

// Connect to Moxa 
const moxaSocket = new EverSocket({
    reconnectWait: 100,      // wait 100ms after close event before reconnecting
    //timeout: 5000,            // set the idle timeout to 100ms
    //reconnectOnTimeout: true // reconnect if the connection is idle
  });
  moxaSocket.on('reconnect', function() {
    console.log('The Moxa socket reconnected following a close or timeout event');
  });
  moxaSocket.on('error', function(err) {
    console.log('The Moxa socket returned an error');
      console.log(err);
  });
  moxaSocket.on('close', function() {
    console.log('Moxa connection "close" received');
      process.exit(1);
  });
  moxaSocket.on('connect', function() {
    console.log('Connected to Moxa');
    // sendnewData('#255:2 /S685082:126 +A \\LST -1');
    //sendnewData('#255:2 +A \\LST -1'); // send speed 4 to BB uncomment to send speed 4 on connect
    sendnewData('#0:2\\MOD1'); // send inital state to xtra beacon 
  });
  moxaSocket.connect(options.moxaPort, options.moxaIpAddress);

  