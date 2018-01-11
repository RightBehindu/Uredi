//App.js

var express = require('express');
var app = express();
var serv = require('http').Server(app);
var colors = require('colors/safe');
var session = "none";

console.log(colors.magenta("[Server]") + colors.white(": SERVER STARTED"));
var SOCKET_LIST = {};
var SESSIONS = {};
var Session = function(id) {
	var self = {
		sessionId: id,
		lobby: [],
		currentUrl: "none",
		isPlaying: false,
		messages: []
	};
	return self;
}
var helloSession = new Session(makeid());
SESSIONS["hello"] = helloSession;

function EmitForLobby(session, emission, data) {
	for(var i in session.lobby) {
		var client = session.lobby[i];
		var clientSocket = SOCKET_LIST[client.id];
		if(client && clientSocket) {
			clientSocket.emit(emission, data);
		}
	}
}

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
	var taken = true;
	while(taken) {
		socket.id = Math.floor(Map(Math.random(), 0, 1, 100000, 999999));
		for(var i in SOCKET_LIST) {
			if(i == socket.id) {
				continue;
			}
		}
		taken = false;
	}
	for(var i in SOCKET_LIST) {
		SOCKET_LIST[i].emit('userConnected', {lol: "hi"});
	}
	SOCKET_LIST[socket.id] = socket;
	SOCKET_LIST[socket.id].session = {sessionAdmin: false, sessionOwner: false, inSession:false ,sessionId:"none"};


	console.log(colors.magenta('[Server]:') + ' User with Id ' + colors.yellow('"'+ socket.id + '"') + ' has ' + colors.green('connected'));

	socket.on('disconnect', function() {

		if(socket.session.inSession) {
			var session = SESSIONS[socket.session.sessionId];
			if(session) {
				if(session.lobby.length == 1) {
					delete SESSIONS[socket.session.sessionId];
				} else {
					//Remove self from current session lobby.
					for(var i in session.lobby) {
						if(session.lobby[i].id == socket.id) {
							session.lobby.splice(i, 1);
						}
					}
					//Choose next admin as owner.
					for(var i in session.lobby) {
						if(session.lobby[i].isAdmin) {
							session.lobby[i].isOwner = true;
							SOCKET_LIST[session.lobby[i].id].session.sessionOwner = true;
							break;
						}
					}

					//Update lobby listing for all lobby members.
					EmitForLobby(session, "updateLobby", {lobby: session.lobby});
				}
			}
		}


		delete SOCKET_LIST[socket.id];
		for(var i in SOCKET_LIST) {
			SOCKET_LIST[i].emit('userDisconnected', {lol:"hi"});
		}

		// TODO: Check if in session.
		// TODO: Check for other admins or users in current session

		console.log(colors.magenta('[Server]:') + ' User with Id ' + colors.yellow('"'+ socket.id + '"') + '" has ' + colors.red('disconnected.'));
	});

	socket.on("joinSession", function(data) {
		if(SESSIONS[data.sessionId]) {
			//Join session.
			var session = SESSIONS[data.sessionId];
			session.lobby.push({id: socket.id, canQueue: true, videoTime: 0, frozen: false, ready: true, isAdmin: false, isOwner: false});
			SOCKET_LIST[socket.id].session = {sessionAdmin: false, sessionOwner: false, inSession:true,sessionId:data.sessionId};
			socket.emit("successJoin", {id: data.sessionId, url: session.currentUrl, isPlaying: session.isPlaying, messages: session.messages});
			for(var i in session.lobby) {
				var client = session.lobby[i];
				var clientSocket = SOCKET_LIST[client.id];
				if(client && clientSocket) {
					clientSocket.emit("updateLobby", {lobby: session.lobby});
				}
			}
		} else {
			socket.emit("failJoin", {});
		}
	});

	socket.on("createSession", function(data) {
		var newSession = new Session(data.sessionId);
		newSession.lobby.push({id: socket.id, canQueue: true, videoTime: 0, frozen: false, ready: true, isAdmin: true, isOwner: true});
		SESSIONS.push(newSession);

		SOCKET_LIST[socket.id].session = {sessionAdmin: true, sessionOwner: true, inSession: true, sessionId: newSession.id};

	})

	socket.on("startVideo", function(data) {
		var readyToStart = true;
		console.log("here!");
		var self = SOCKET_LIST[socket.id];
		if(self.session.sessionId == "none") {
			var newSession = new Session(makeid());
			newSession.lobby.push({id: socket.id, canQueue: true, videoTime: 0, frozen: false, ready: true, isAdmin: true, isOwner: true});
			socket.session = {sessionAdmin: true, sessionOwner: true, inSession: true, sessionId: newSession.sessionId};
			SESSIONS[newSession.sessionId] = (newSession);
			socket.emit("successJoin", {id: newSession.sessionId, url: "none", messages: newSession.messages});
		}
		console.log("Here: " + self.session.sessionId);
		if(self.session.sessionAdmin || self.session.sessionOwner) {
			var session = SESSIONS[self.session.sessionId];
			if(session) {
				console.log(session.lobby);
				for(var i in session.lobby) {
					var client = session.lobby[i];
					var clientSocket = SOCKET_LIST[client.id];
					if(client && clientSocket) {
						if(!client.ready) {
							readyToStart = false;
						}
					} else {
						console.log("No client glitch!");
					}
				}
			} else {
				throw new Error("Session didn't exist somehow...please report");
			}

			if(readyToStart) {

				session.currentUrl = data.url;
				for(var i in session.lobby) {
					var client = session.lobby[i];
					var clientSocket = SOCKET_LIST[client.id];
					if(client && clientSocket) {
						console.log("send to " + client.id);
						clientSocket.emit("updateLobby", {lobby: session.lobby});
						clientSocket.emit("loadVideo", {url: data.url});
					} else {
						console.log("No client glitch!");
					}
				}
			} else {
				//One or more lobby clients aren't ready.
				socket.emit("startFailReady", {});
			}
		} else {
			socket.emit("startFailPerms", {});
		}
	});

	socket.on("changeId", function(data) {
		var oldId = socket.id;
		SOCKET_LIST[data.id] = SOCKET_LIST[socket.id];
		delete SOCKET_LIST[socket.id];
		socket.id = data.id;

		if(SOCKET_LIST[socket.id].session.inSession) {
			var session = SESSIONS[SOCKET_LIST[socket.id].session.sessionId];
			if(session) {
				for(var i in session.lobby) {
					var clientId = session.lobby[i];
					if(clientId == oldId) {
						session.lobby.splice(i, 1);
						session.lobby.push(socket.id);
						break;
					}
				}
				EmitForLobby(session, "updateLobby", {lobby: session.lobby});
			} else {
				console.log("No session glitch");
			}
		}
	});

	socket.on("startVideoAgain", function(data){
		if(!socket.session.inSession) return;
		if(!socket.session.sessionAdmin) return;
		var session = SESSIONS[socket.session.sessionId];
		session.isPlaying = true;
		console.log("starting");

		if(session) {
			for(var i in session.lobby) {
				var client = session.lobby[i];
				if(client) {
					if(SOCKET_LIST[client.id]) {
						console.log("Start command to - " + client.id);
						SOCKET_LIST[client.id].emit("startVideoAgain", {time: data.time});
					}
				}
			}
		} else {
			console.log("No session glitch #2");
		}
	});

	socket.on('videoPause', function(data) {
		if(!socket.session.inSession) return;
		var session = SESSIONS[socket.session.sessionId];
		if(session) {
			session.isPlaying = false;
			for(var i in session.lobby) {
				var client = session.lobby[i];
				if(client) {
					if(client.id == socket.id) continue;
					if(SOCKET_LIST[client.id]){
						SOCKET_LIST[client.id].emit("pauseVideo", {id: socket.id});
					}
				}
			}
		} else {
			console.log("No session glitch #2");
		}
	});
	socket.on("adminUser", function(data) {
		console.log("trying");
		var id = data.id;
		console.log(id);
		var client = SOCKET_LIST[id];
		if(client) {
			client.session.sessionAdmin = true;
			for(var i in SESSIONS[client.session.sessionId].lobby) {
				var lobbyClient = SESSIONS[client.session.sessionId].lobby[i];
				if(lobbyClient) {
					if(lobbyClient.id == client.id) {
						lobbyClient.isAdmin = true;
					}
				}
			}
			client.emit("madeAdmin");
			client.emit("updateLobby", {lobby: SESSIONS[client.session.sessionId].lobby});
			console.log("done");
		}

	});

	socket.on("kickUser", function(data) {
		if(SOCKET_LIST[socket.id].session.sessionOwner || SOCKET_LIST[socket.id].session.sessionAdmin ) {

			var userId = data.id;
			var session = SESSIONS[socket.session.sessionId];
			for(var i in session.lobby) {
				var client = session.lobby[i];
				if(client.id == userId) {
					session.lobby.splice(i, 1);
					break;
				}
			}
			EmitForLobby(session, "updateLobby", {lobby: session.lobby});
			SOCKET_LIST[userId].emit("kicked");
		}
	});
	
	socket.on("newMessage", function(data) {
		console.log("asdlkdf");
		if(socket.session.inSession) {
			var session = SESSIONS[socket.session.sessionId];
			if(session) {
				session.messages.push({message: data.message, sender: socket.id});
				EmitForLobby(session, "updateChat", session.messages);
				console.log("emitted");
			} else {
				console.log("No session glitch #3!");
			}
		}
	});

	socket.emit('receivedConnect',{id: socket.id});


});
app.get('/',function(req, res) {
	if(req.query.session) {
		session = req.query.session;
	}
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);

function Map(X, A, B, C, D) {
	return (X-A)/(B-A) * (D-C) + C;
}
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 7; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
