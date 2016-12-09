var usb = require("usb")
var robot  = require("robotjs")
var test = require("./test.js")

var myUsb = {
  "vid": 312,
  "pid": 312
}

usb.setDebugLevel(0)

function checkForDevice() {
  if(!usb.findByIds(myUsb.vid, myUsb.pid)) {

  usb.on('attach', function (device) {
    console.log("New device found! [VID: "+device.deviceDescriptor.idVendor+ " | PID: "+device.deviceDescriptor.idProduct+"]")
    console.log("We are looking for device with VID|PID: "+myUsb.vid+"|"+myUsb.pid)
    if (device.deviceDescriptor.idVendor === myUsb.vid && device.deviceDescriptor.idProduct === myUsb.pid) {
      main()
    }
  })
}
else {
  main()
}
}

function main() {
  console.log("Found our device!")
  //var app = server()
  test()
  //server.post()
}

checkForDevice()
