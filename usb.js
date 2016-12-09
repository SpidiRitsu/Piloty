var usb = require("usb")
//console.log(usb.getDeviceList())
var myUsb = usb.findByIds(2385, 5639) //dla pilota 312,312

usb.setDebugLevel(0)

function poll(device) {
	console.log("Launched")
	device.interface().endpoint(129).transfer(64,function(err,data) {
	console.log("READY")	
if (err) return console.error(err)
	console.log(data.toString('hex'))
	poll(device)
})
}

//myUsb.open()
usb.on('attach', function(device) {
	console.log("plugged device [VID: "+device.deviceDescriptor.idVendor+ " | PID: "+device.deviceDescriptor.idProduct+"]")
	device.open()
	device.interface().claim()
	console.log(device.interface().endpoints[0].direction)
	if(device.deviceDescriptor.idVendor === 312 && device.deviceDescriptor.idProduct === 312) {
	console.log("WAITING FOR POLL")
	//device.interface().claim()
	//device.interface().endpoints[0].startPoll(2,64)
	//console.log(nTransfers)
	/*setTimeout(function(){device.interface().endpoints[0].stopPoll(function(err,data) {
	if(err) return console.log(err)
	//console.log(data)
})},4000)*/
console.log("waiting for polls from transfer")
poll(device)
	/*device.interface().endpoints[0].transfer(64, function(err,data) {
		if (err) return console.error(err)
		var str = data.toString('hex')
		console.log(str)
		//console.log(nTransfers)
		return true	
})*/
}
})
usb.on('detach', function(device) {
	console.log("unplugged device [VID: "+device.deviceDescriptor.idVendor+ " | PID: "+device.deviceDescriptor.idProduct+"]")
	device.close()
})

//console.log(myUsb.interface().endpoint(2).transfer("wololoo", console.log))
/*	myUsb.interface().endpoint(129).transfer(64, function(err,data) {
		if (err) return console.error(err)
		var str = data.toString('hex')
		console.log(str)
console.log("----POLLING----")
	})
//var test = myUsb.interface().endpoint(129).startPoll(nTransfers=1, transferSize=64)

/*myUsb.interface().endpoint(129).stopPoll(function(err,data) {
	if(err) return console.error(err)
	console.log(data)
})*/

/*setTimeout(function(){

myUsb.interface().endpoint(129).stopPoll(function(err, data) {
	//if (err) return console.error(err)
		//var str = data.toString('hex')
		//console.log(str)
	console.log(err, data)
console.log("---")
console.log(test)
console.log("---")

})
})
}, 5000)*/
