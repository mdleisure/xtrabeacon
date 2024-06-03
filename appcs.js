/**
 * _How the DeHaardt Light/Shutdown Control Works_
 * The application connects to a DeHaardt remote (via special order cable from DeHaardt)
 * or Range Extender via a Moxa Serial to IP converter. This application mimics the commands sent to
 * the legacy "IP surge strip".
 *
 * - The Moxa is setup as a TCP Server on port 8888 with the following serial settings: 19200 8/N/1/None
 * - Club Speed is then setup in the Control Panel MainEngine:ControlLightIPAddress as: "127.0.0.1:3000"
 *
 * We must run one program for the Club Speed Server to connect to:
 *   1. Node.js-based DeHaardt Lighting application that is run from Fire Daemon
 *
 * _Node Setup_
 * 1. Place "app.js" and "package.json" into a directory such as "C:\ClubSpeedCustomApps\dehaardt"
 * 2. From command prompt, go into this directory and run "npm install" to download libraries
 * 3. Edit app.js and edit configuration "options" at the top of the file. Notably Moxa IP/port and enableShutdown
 * 4. Run from Fire Daemon (similar set on application, working directory and parameters to other node programs)
 *
 * _Club Speed Setup_
 * 1. In "Control Panel", setup a light controller. This is how Club Speed controls DeHaardt, by Light States.
 *    Update the setting in Control Panel MainEngine:ControlLightIPAddress to: "127.0.0.1:3000"
 * 2. From "Race Control", you can access the "Light Control" panel to handle automatic changing of the lights.
 *
 * _Shutdown Configuration_
 * Enable or disable and also setup the speed to go to in the options below
 *
 * _Moxa N-Port Setup_
 * From the Moxa website you can download the "N-Port Search Utility" and locate the Moxa on the network/assign an IP.
 *
 * _Troubleshooting_
 * The node.js DeHaardt app can be run interactively (or you can click on the Windows "Interactive Services" popup in the task bar to see it)
 * 1. Stop the "DeHaardt" service in FireDaemon
 * 2. Open command prompt
 * 3. Issue: cd C:\ClubSpeedCustomApps\dehaardt
 * 4. Issue: node app.js
 */

var express = require('express');
var url = require('url');
var app = express();
var EverSocket = require('eversocket').EverSocket;

var options = {
	moxaIp: '192.168.5.55',
	moxaPort: 8888,
	listenPort: 3000,
	enableShutdown: true, // or "false"
	speedWhenLightColumnOneIsGreen: 'unlimited', // stop, slow, medium, fast, unlimited
	speedWhenLightColumnOneIsRed: 'slow', // stop, slow, medium, fast, unlimited
	speedWhenLightColumnOneIsOff: 'slow' // stop, slow, medium, fast, unlimited
}

// DEHAARDT
var deHaardtStream = new EverSocket({
  reconnectWait: 100,      // wait 100ms after close event before reconnecting
  //timeout: 100,            // set the idle timeout to 100ms
  //reconnectOnTimeout: true // reconnect if the connection is idle
});
deHaardtStream.on('data', function(data) {
  console.log('Received from DeHaardt:');
	console.log(data);
});
deHaardtStream.on('end', function() {
  console.log('DeHaardt disconnected');
});
deHaardtStream.on('connect', function() {
	console.log('Connected to DeHaardt');
});
deHaardtStream.on('reconnect', function() {
  console.log('DeHaardt reconnected');
});
deHaardtStream.connect(options.moxaPort, options.moxaIp);

function sendShutdownCommand(command) {
	if(options.enableShutdown !== true) {
		console.log('Shutdown Disabled, cannot send: ', command);
		return;
	}
	
	var speedlevel;
	
	switch(command) {
		case 'stop':
			speedlevel = '0';
			break;
		case 'slow':
			speedlevel = '2100';
			break;
		case 'medium':
			speedlevel = '3000';
			break;
		case 'fast':
			speedlevel = '4000';
			break;
		case 'unlimited':
			speedlevel = '-1';
			break;
		default:
			console.log('Unkonwn speed command: ' + command);
			return;
	}
	var msg = '#255:2 +A \\LST' + speedlevel + "\r\n";
	console.log('Sending:', msg);
	deHaardtStream.write(msg);
}

var lightStates = {
	1: 'OFF',
	2: 'OFF',
	3: 'OFF',
	4: 'OFF',
	5: 'OFF',
	6: 'OFF',
	7: 'OFF',
	8: 'OFF'
	};

app.get('/dehaardt', function(req, res){
	var body = '';
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;

	// Set the speed level states
	if(query['ALL']) {
		// Send slowdown command
		console.log('Sending DeHaardt command: ' + query['ALL']);
		body = ' SENT ' + query['ALL'];
		sendDehaardtCommand(query['ALL']);
	}
	
	body = 'OK' + body;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.end(body);
	
});

app.get('/outlet', function(req, res){
  var body = 'OK';
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.end(body);
	
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;

	// Set the light states
	for(var key in query) {
		if(query[key] == 'ON' || query[key] == 'OFF')
			lightStates[key] = query[key];	
	}
	
	console.log(lightStates);
	
	// Send lights
	sendLightCommand();
	
	// Send Shutdown Command (if enabled)
		if(lightStates[1] === 'ON') {
			sendShutdownCommand(options.speedWhenLightColumnOneIsGreen);
		} else if(lightStates[5] === 'ON') {
			sendShutdownCommand(options.speedWhenLightColumnOneIsRed);
		} else if(lightStates[1] === 'OFF' && lightStates[5] === 'OFF') {
			sendShutdownCommand(options.speedWhenLightColumnOneIsOff);
		}
});

app.get('/outleto', function(req, res){
  var body = 'LIGHTSTATES';
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.end(body);
	
	console.log(lightStates);
});

/* LISTEN ON WEB SERVER */
app.listen(options.listenPort);
console.log('Listening on port ' + options.listenPort);

function sendLightCommand() {

		var data;
		//874018
		var red = Buffer('#0:233\\LGT SRR' + "\r\n");
		var green = Buffer('#0:233\\LGT RRS' + "\r\n");
		var yellow = Buffer('#0:233\\LGT RSR' + "\r\n");
		var off = Buffer('#0:233\\LGT RRR' + "\r\n");
		
		if(lightStates['5'] == 'ON') {
			data = red;
		} else if(lightStates['1'] == 'ON') {
			data = green;
		} else {
			data = off;
		}
		
		console.log('Sending light: ' + data);
		deHaardtStream.write(data);

}

process.on('uncaughtException', function (err) {
  console.error(err);
});