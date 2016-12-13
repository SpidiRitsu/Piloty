var socket = io();
var angle = 0;
$(document).ready(function() {
  console.log("fine");
  socket.on("kappa", function(code) {
    console.log(code);
    console.log("emitting");
    angle += 15;
    $("#Kappa").css('transform','rotate(' + angle + 'deg)');
  });
});
