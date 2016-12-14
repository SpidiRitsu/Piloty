var socket = io();
var angle = 0;
var quizing = false;
var alreadyUsed = [];
$(document).ready(function() {
  console.log("fine");
  socket.on("kappa", function(code) {
    console.log(code);
    console.log("emitting");
    angle += 15;
    $("#Kappa").css('transform','rotate(' + angle + 'deg)');
  });
  //ODPOWIADANIE
  $("#loadQuizSelectList").click(function() {
    quizing = localStorage.getItem('__quizing');
    console.log(quizing);
    localStorage.removeItem('__quizing');

  });
  socket.on("emitTranslatedCode", function(pilotId, code) {
    if(quizing) {
      console.log(pilotId, code);
      if(alreadyUsed.indexOf(pilotId) !== -1)
        console.log("pilot was already used!");
      else {
        console.log("Code sent by pilot "+pilotId+" :"+code);
        switch(code) {
          case "1": {
            $("#answer"+code+"QuizMainBox").css("background-color", "#5cb85c");
            alreadyUsed.push(pilotId);
          }; break;
          case "2": {
            $("#answer"+code+"QuizMainBox").css("background-color", "#5cb85c");
            alreadyUsed.push(pilotId);
          }; break;
          case "3": {
            $("#answer"+code+"QuizMainBox").css("background-color", "#5cb85c");
            alreadyUsed.push(pilotId);
          }; break;
          case "4": {
            $("#answer"+code+"QuizMainBox").css("background-color", "#5cb85c");
            alreadyUsed.push(pilotId);
          }; break;
          case "-0": {
            localStorage.setItem('__change', "waddup!");
            sessionStorage.setItem("waddup", "waddup!");
          }; break;
        }
      }
    }
  });
});
