// Load required modules
var https    = require("https");              // http server core module
var express = require("express");           // web framework external module
var io      = require("socket.io");         // web socket external module
var easyrtc = require("easyrtc");           // EasyRTC external module

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var httpApp = express();
httpApp.use(express.static(__dirname + "/static/"));

var fs = require('fs');
/*var options = {
    key: fs.readFileSync('/etc/ssl/server.key'),
    cert: fs.readFileSync('/etc/ssl/server.crt')
};*/
var options = {
    key: fs.readFileSync('/home/ubuntu/kurento-recorder/cert/alphassl.key'),
    cert: fs.readFileSync('/home/ubuntu/kurento-recorder/cert/alphassl.crt')
};
// Start Express http server on port 90
var webServer = https.createServer(options, httpApp).listen(80);

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(webServer, {"log level":1});

// Start EasyRTC server
var rtc = easyrtc.listen(httpApp, socketServer);
var userRegistary = {};
socketServer.sockets.on('connection', function (socket) 
{	
	
	socket.on('getId', function (data) 
	{
		socket.emit('onId', socket.id);
	});
	socket.on('addUser', function (data) 
	{

        var userArray    = {};
        var room         = data.room;
        socket.room      = room;
        data.id          = socket.id;
		if(userRegistary.hasOwnProperty(room)){
			userArray               = userRegistary[room];
		}
		userArray[socket.id]        = data;
		userRegistary[room]         = userArray;	
		socketServer.sockets.emit('onUserList', userRegistary);
	});
    socket.on('sendToAll', function (data) 
	{
        socket.broadcast.emit('onReceivesendtoAll', data);
        if(data['method'] == 'admin_control'){
        	var userArray    = {};
        	var room         = data.room;
        	var socketId     = data.id;
	        if(userRegistary.hasOwnProperty(room)){
				userArray               = userRegistary[room];
			}
			var userData      = userArray[socketId];
			if(data.action == 'cam'){
                userData.cam = data.status;
			}else if(data.action == 'mic'){
                userData.mic = data.status;
			}else if(data.action == 'chat'){
                userData.chat = data.status;
			}else{
                userData.doc = data.status;
			}
			userArray[socketId] = userData;
			userRegistary[room] = userArray;
        }
        
	});
	socket.on('disconnect', function () 
	{
         //socket.broadcast.emit('onDisconnectUser', socket.id);
         var room       = socket.room;
         if(userRegistary.hasOwnProperty(room)){
	            userArray          = userRegistary[room];
	            if(userArray.hasOwnProperty(socket.id)){
	               delete userArray[socket.id];
	               userRegistary[room] = userArray;	
	               socketServer.sockets.emit('onUserList', userRegistary);
	            }
	     }
     });
});
