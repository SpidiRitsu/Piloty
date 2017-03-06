module.exports = function() {
var io;
var fs = require("fs");
var path = require("path");
var shortid = require('shortid');
var validUrl = require('valid-url');
var appId = shortid.generate();
console.log(appId);
function readQuestions() {
	var questions = {};
	fs.readdir(__dirname+"/Saves", function (err, files) {
		if (err) return console.log(err);
		files.forEach(function(file) {
			// console.log(file);
			questions[file.slice(0,file.length-4)] = fs.readFileSync(__dirname+"/Saves/"+file, "utf-8").split("\r\n"); //ZMIENIC NA LINUXIE NA \n
		});
		// console.log(questions);
	});
}

/* -- WLASCIWE FUNKCJE -- */

function appendQuestion(fileName, question) {
  fs.appendFile(__dirname+"/Saves/"+fileName+".txt", question, 'utf-8', function (err) {
    if (err) return console.error(err);
    // console.log("appending "+fileName);
  });
}

function checkIfFileExists(fileToCheck) {
  var result = false;
  fileToCheck = fileToCheck + ".txt";
  var files = fs.readdirSync(__dirname+"/Saves");
  // console.log(files);
  files.forEach(function(file) {
    if(file === fileToCheck)
      result = true;
  });
  return result;
}

function loadQuestionsFromFiles() {
	var json = {};
	var files = fs.readdirSync(__dirname+"/Saves");
	files.forEach(function(file) {
		var extname = path.extname(file);
		if(extname === ".txt") {
			var content = fs.readFileSync(__dirname+"/Saves/"+file, "utf-8");
			// console.log(file + ": "+content);
			json[file] = content;
		}
	});
	// console.log(json);
	return json;
}

function loadStudents() {
	var json = {};
	var files = fs.readdirSync(__dirname+"/Klasy");
	files.forEach(function(file) {
		var extname = path.extname(file);
		if(extname === ".txt") {
			var content = fs.readFileSync(__dirname+"/Klasy/"+file, "utf-8");
			json[file.slice(0, -4)] = {};
			content = content.split(/\r?\n/);
			for(var i=0; i<content.length; i++) {
				var temp = content[i].split('. ');
				json[file.slice(0, -4)][temp[0]] = temp[1]; 
			}
		}
	});
	return json;
}

function main(appId) {
	var express = require("express");
	var app = express();
	var server = require("http").Server(app);
	io = require("socket.io")(server);
	var opn = require("opn");
  	var bodyParser = require("body-parser");
  	var cookieParser = require('cookie-parser');

  	var currentQuestion;
    var currentTest;
  	var connectedRemotes = {};

  app.use(cookieParser("secret?"));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.enable('trust proxy');

	app.use(express.static(__dirname+"/Public"));
	app.use(express.static(__dirname+"/Emulator"));

	app.get("/", function (req,res) {
		res.sendFile(__dirname+"/Public/index.html");
	});
  app.get("/emulator", function (req,res) {
    res.sendFile(__dirname+"/Public/emulator.html");
  });

  app.get("/emulator", function (req,res) {
    res.sendFile(__dirname+"/Public/test.html");
  });

  app.get("/smartphones", function (req,res) {
  	res.sendFile(__dirname+"/Public/smartphones.html");
  });

  app.post("/smartphoneSetCookiesAndStudents", function (req, res) {
    let cookies = req.signedCookies;
  	let deviceId = cookies['deviceId'];
  	if (req.cookies['io'] !== undefined)
  		res.clearCookie('io');
  	if (cookies['appId'] === undefined || cookies['appId'] !== appId) {
  		deviceId = shortid.generate();
  		res.cookie('deviceId', deviceId, {maxAge: 43200000, signed: true})
  			.cookie('appId', appId, {maxAge: 43200000, signed: true});
  	}
  	else if (cookies['deviceId'] === undefined) {
  		deviceId = shortid.generate();
  		res.cookie('deviceId', deviceId, {maxAge: 43200000, signed: true});
  	}
  	res.json({
  		students: loadStudents(),
  		user: cookies['user'],
  		userData: {
  			deviceId: deviceId,
  			ip: req.ip,
  			software: req.headers['user-agent'].split('(')[1].split(')')[0]
  		}
  	});
  });

  app.post("/smartphoneDeleteCookies", function (req, res) {
  	let cookies = req.signedCookies;
  	for(let key in cookies) {
  		res.clearCookie(key);
  	}
  	res.end();
  });

  app.post("/smartphoneSetUser", function (req, res) {
  	let username = req.body.name;
    let userclass = req.body.class;
	let usernumber = req.body.number;
	res.cookie('user', JSON.stringify({
		'username': username,
		'userclass': userclass,
		'usernumber': usernumber
	}), {signed: true});
  	res.end();
  });

  app.post('/smartphoneSetSettings', function (req,res) {
  	let setting = req.body.setting;
  	let value = req.body.value;
  	let json;
  	if (req.signedCookies['settings'] === undefined)
  		json = {};
  	else
  		json = JSON.parse(req.signedCookies['settings']);
  	if (typeof(setting) === 'object' && typeof(value) === 'object') {
  		for(let i=0; i<setting.length; i++) {
  			// console.log(setting[i], value[i]);
  			json[setting[i]] = value[i];
  		}
  	}
  	// console.log('updated settings:');
  	// console.log(json);
  	res.cookie('settings', JSON.stringify(json), {signed: true});
  	res.end();
  });

  app.post('/smartphoneReadSettings', function (req, res) {
  	let cookies = new Promise(resolve => resolve(req.signedCookies));
  	cookies.then(cookies => {
  		// console.log('read settings:');
  		// console.log(JSON.parse(cookies['settings']));
  		res.send(JSON.parse(cookies['settings']));
  	});
  });

  app.post("/smartphoneSendCode", function (req, res) {
  	var cookies = req.signedCookies;
  	var smartphoneId = cookies['deviceId'];
  	var smartphoneCode = req.body.code;
  	if (cookies['appId'] === appId) {
  		emulateRemoteFromSmartphone(smartphoneId, smartphoneCode);
      res.end();
  	}
  	else {
  		res.end();
  	}
  });

  app.post('/smartphoneReloadQuestion', function (req, res) {
  	let deviceId = req.signedCookies['deviceId'];
  	if (connectedRemotes !== undefined && connectedRemotes !== null) {
  		if (Object.keys(connectedRemotes).indexOf(deviceId) !== -1)
  			res.send(currentQuestion);
  		else 
			res.end();
  	}
  	else
  		res.end();
  });

  app.post('/smartphoneConfirmId', function (req, res) {
  	let deviceId = req.signedCookies['deviceId'];
  	if (connectedRemotes !== undefined && connectedRemotes !== null) {
	  	if (Object.keys(connectedRemotes).indexOf(deviceId) !== -1)
	  		res.json({
	  			bool: true,
	  			deviceId: deviceId
	  		});
	  	else 
			res.json({
				bool: false,
				deviceId: deviceId
			});
  	}
  	else {
  		res.end();
  	} 
  });

  app.post('/savedResults', function(req, res) {
    var results = JSON.parse(req.body.results);
    // fs.writeFile('/')   //dokonczyc
    res.end();
  });

  app.post("/emulatorSendCode", function(req, res) {
    var remoteId = req.body.id;
    var remoteCode = req.body.code;
    // console.log(remoteId, remoteCode);
    emulatorCodeTranslation(remoteId, remoteCode);
    // io.emit("emulatorCode", remoteId, remoteCode);
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end();
  });

  app.post("/createQuestion", function(req,res) {
    var question = req.body.question;
    var file = req.body.file;
    // console.log(req.body);
    // console.log(req.body.question);
    // console.log(file, question);
    appendQuestion(file, question);
    // res.writeHead(200, {"Content-Type": "application/json"});
    // res.json(question);
    res.end();
  });

  app.post('/checkIfAnswersAreUrl', function(req, res) {
  	var questions = req.body.questions;
  	var arr = [];
  	questions.forEach(function(q) {
  		if(validUrl.isUri(q))
  			arr.push('{i}'+q+'{I}');
  		else
  			arr.push(q);
  	});
  	res.send(arr);
  });

  app.post("/submitQuestionList", function(req,res) {
    var questionListName = req.body.listName;
    console.log(questionListName);
    res.writeHead(200, {"Content-Type": "text/plain"});
    if (checkIfFileExists(questionListName)) {
      res.end("true");
    }
    else {
      appendQuestion(questionListName, "");
      res.end("false");
    }
  });

	app.post("/loadQuestionsFromFiles", function (req, res) {
		var json = loadQuestionsFromFiles();
		// console.log(myJson);
		res.json(json);
		res.end();
	});

	app.post("/loadStudents", function (req, res) {
		var json = loadStudents();
		res.json(json);
	});

	io.on("connection", function(socket) {
		// console.log("someone connected");
		socket.on("disconnect", function() {
			// console.log("someone DISCONNECTED");
		});
		socket.on("send question to device", function(index, question, remotes) {
			currentQuestion = {index: index, question: question};
			connectedRemotes = remotes;
			io.emit('question', {index: index, question: question}, connectedRemotes);
		});
		socket.on('everyone_connected', function (bool, remotes) {
			connectedRemotes = remotes;
			io.emit('everyoneConnected', bool);
		});
		socket.on('quizIsFinished', function (bool, json) {
			io.emit('quizIsFinished', bool, json);
		});
    socket.on('testIsReady', function (json) {
      var files = loadQuestionsFromFiles();
      var groups = [];
      var temp = json;
      for(var key in json) {
        json[key]['content'] = files[json[key]['plik']];
        delete temp[key]['plik'];
        groups.push(temp);
      }
      currentTest = temp;
    });
	});



	// readQuestions();
	let port = (process.env.PORT || 3000)
	server.listen(port, function() {
		console.log('Listening on port '+port);
	});

	var usb = require("usb");
	//var mouse = require("./mouse.js")(2,5)
	usb.setDebugLevel(0);

	var myUsb = usb.findByIds(312,312);
  var i=0;
	if(!myUsb) {

    return console.log("NO DEVICE!!!!");
  }
  else {
    myUsb.open();
    myUsb.interface().claim();
    poll(myUsb,i); // 3 argument "io"
  }
}

function emulateRemoteFromSmartphone(remoteId, remoteCode) {
	io.emit('emitTranslatedCode', remoteId, remoteCode);
}

function emulatorCodeTranslation(remoteId, remoteCode) {
  var encryptionData = {
    "0": "0c",
    "1": "02",
    "2": "09",
    "3": "0e",
    "4": "03",
    "5": "0a",
    "6": "0f",
    "7": "04",
    "8": "0b",
    "9": "10",
    "/": "05",
    ".": "11",
    "-": "06"
  };
  remoteCode = remoteCode.slice('');
  var translatedData;
  if(remoteId !== "80c0") {
    translatedData = "03280000"+remoteId;
    for(var i=0; i<remoteCode.length; i++) {
      for(var key in encryptionData) {
        if(key === remoteCode[i]) {
        translatedData += encryptionData[key];
        }
      }
    }
  }
  else if(remoteId === "80c0") {
    translatedData = "01148000"+remoteId+remoteCode;
  }
  console.log(translatedData);
  parseData(translatedData);
}

function poll(device, counter) { //3 argument "server"
	counter++;
	//console.log("\n\n["+counter+"] Waiting for a poll. . .")
	device.interface().endpoint(129).transfer(64,function(err,data) {
		if (err) return console.error(err);
		data = data.toString('hex');
		if(data.slice(0,12) == "032800000000") {
			//console.log("~~ IGNORING THIS LINE!")
		}
		else {
		//console.log(data)
		// console.log("["+counter+"]------------------------------------------");
		parseData(data); // 2 argument "server"
		}
		//console.log("------------------------------------------")
		poll(device, counter);
	});
}

function parseData(data) { //tu byl drugi argument "server"
	var encryptionData = {
		"0c": "0",
		"02": "1",
		"09": "2",
		"0e": "3",
		"03": "4",
		"0a": "5",
		"0f": "6",
		"04": "7",
		"0b": "8",
		"10": "9",
		"05": "/",
		"11": ".",
		"06": "-"
	};
	var pilot = {
		Header: data.slice(0,8),
		Id: undefined
	};
	data = data.slice(8);
	data = data.match(/.{1,2}/g);
	data = data.filter(function(item) {
		return item !== "00";
	});
	pilot.Id = data.shift() + data.shift();
	// console.log("Header: "+pilot.Header);
	console.log("ID: "+pilot.Id);
	// console.log(data);
	var translatedData = [];
	for(var key in encryptionData) {
		for(var i=0; i<data.length; i++) {
			if(key === data[i])
				translatedData[i] = encryptionData[key];
		}
	}
	if(translatedData.length !== 0 && pilot.Header === "03280000") {
		// console.log("Code sent: "+translatedData.join(''));
		io.emit("emitTranslatedCode", pilot.Id, translatedData.join(''));
	}
	if(pilot.Header === "01148000" && data.join('') === "03") {
		console.log("EMITTING STOP QUIZING: "+data.join(''));
		io.emit("emitTranslatedCode", pilot.Id, data.join(''));
	}
	// console.log(data.join(''));
	var codeKappa = data.join('');
	if(codeKappa=="2006" || codeKappa=='2005') {
		io.emit("kappa", codeKappa);

	}
	//wypierdzielac z tym szajsem ponizej
	//var mouse = require("./mouse.js");
	//mouse(1,5,data);
}

main(appId);
};
