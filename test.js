module.exports = function() {
var io
function main() {
	var express = require("express")
	var app = express()
	var server = require("http").Server(app)
	io = require("socket.io")(server)
	var opn = require("opn")

	app.use(express.static(__dirname+"/Public"))

	app.get("/", function (req,res) {
		res.sendFile(__dirname+"/Public/indexTest.html")
	})
	io.on("connection", function(socket) {
		console.log("someone connected")
		setInterval(function() {
			io.emit("first emit", Math.random().toFixed(2))
		},1000)
		socket.on("disconnect", function() {
			console.log("someone DISCONNECTED")
		})
	})

	server.listen(process.env.PORT || 3000, "localhost")
	if(process.env.PORT===undefined)
		console.log("listening on port 3000")
	else
		console.log("listening on port " + process.env.PORT)
	if(process.argv[2]==="open") {
		if(process.env.PORT===undefined)
			opn("http://localhost:3000")
		else
			opn("http://localhost:"+process.env.PORT)
	}

	var usb = require("usb")
	//var mouse = require("./mouse.js")(2,5)
	usb.setDebugLevel(0)

	var myUsb = usb.findByIds(312,312)
	if(!myUsb)
		return console.log("NO DEVICE!!!!")
	var i=0

	myUsb.open()
	myUsb.interface().claim()
	poll(myUsb,i,io)
}

function poll(device, counter, server) {
	counter++
	//console.log("\n\n["+counter+"] Waiting for a poll. . .")
	device.interface().endpoint(129).transfer(64,function(err,data) {
		if (err) return console.error(err)
		data = data.toString('hex')
		if(data.slice(0,12) == "032800000000") {
			//console.log("~~ IGNORING THIS LINE!")
		}
		else {
		//console.log(data)
		console.log("["+counter+"]------------------------------------------")
		parseData(data, server)
		}
		//console.log("------------------------------------------")
		poll(device, counter)
	})
}

function parseData(data, server) {
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
	}
	var pilot = {
		Header: data.slice(0,8),
		Id: undefined
	}
	data = data.slice(8)
	data = data.match(/.{1,2}/g)
	data = data.filter(function(item) {
		return item !== "00"
	})
	pilot.Id = data.shift() + data.shift()
	console.log("Header: "+pilot.Header)
	console.log("ID: "+pilot.Id)
	console.log(data)
	var translatedData = []
	for(var key in encryptionData) {
		for(var i=0; i<data.length; i++) {
			if(key === data[i])
				translatedData[i] = encryptionData[key]
		}
	}
	if(translatedData.length !== 0 && pilot.Header === "03280000") {
		console.log("Code sent: "+translatedData.join(''))
io.emit("emit", pilot.Id, translatedData.join(''))
	}
	console.log(data.join(''))
	var codeKappa = data.join('')
	if(codeKappa=="2006" || codeKappa=='2005') {
		io.emit("kappa", codeKappa)

	}
	var mouse = require("./mouse.js")
	mouse(1,5,data)
}

main()
}
