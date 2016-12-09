var socket = io();
$(document).ready(function () {
  console.log("Everyything is fine!");
	socket.on("first emit", function(data) {
		//console.log("first emit: "+ data);
	});
	socket.on("emit", function(id, code) {
		$("body").append("ID: "+id+" CODE: "+code+"<br>");
	});

});
