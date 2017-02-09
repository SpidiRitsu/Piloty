module.exports = function() {
var io;
var fs = require("fs");
var path = require("path");
function readQuestions() {
	var questions = {};
	fs.readdir(__dirname+"/Saves", function (err, files) {
		if (err) return console.log(err);
		files.forEach(function(file) {
			console.log(file);
			questions[file.slice(0,file.length-4)] = fs.readFileSync(__dirname+"/Saves/"+file, "utf-8").split("\r\n"); //ZMIENIC NA LINUXIE NA \n
		});
		console.log(questions);
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

function main() {
	var express = require("express");
	var app = express();
	var server = require("http").Server(app);
	io = require("socket.io")(server);
	var opn = require("opn");
  var bodyParser = require("body-parser");

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  //app.enable('trust proxy');

	app.use(express.static(__dirname+"/Public"));

	app.get("/", function (req,res) {
		res.sendFile(__dirname+"/Public/index.html");
	});
  app.get("/emulator", function (req,res) {
    res.sendFile(__dirname+"/Emulator/index.html");
  });

  app.get("/smartphones", function (req,res) {
  	res.sendFile(__dirname+"/Emulator/smartphones.html");
  });

  app.post("/smartphoneSendCode", function (req, res) {
  	res.send(req.ip);
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
    console.log(file, question);
    appendQuestion(file, question);
    // res.writeHead(200, {"Content-Type": "application/json"});
    // res.json(question);
    res.end();
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
		console.log("someone connected");
		setInterval(function() {
			io.emit("first emit", Math.random().toFixed(2));
		},1000);
		socket.on("disconnect", function() {
			console.log("someone DISCONNECTED");
		});
	});


	// readQuestions();
	server.listen(process.env.PORT || 3000);
	if(process.env.PORT===undefined)
		console.log("listening on port 3000");
	else
		console.log("listening on port " + process.env.PORT);
	if(process.argv[2]==="open") {
		if(process.env.PORT===undefined)
			opn("http://localhost:3000");
		else
			opn("http://localhost:"+process.env.PORT);
	}
  if(process.argv[2]==="emulator" || process.argv[3]==="emulator") {

  }

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

main();
};
