var timerId;
var snackbarTimerId;

$(document).ready(function() {
  //TO PONIZEJ DO NAPRAWY BUGA W FIREFOXIE!
  $("#submitQuestionList").attr("disabled",false);
  //TO POWYZEJ DO NAPRAWY BUGA W FIREFOXIE!
  //SPRAWDZIC CZY BUG TEN DZIALA W SZKOLE!: PODCZAS WYSWIETLANIA SNACKBARRA Z ERROREM ODSWIEEZYC STRONE!
  $(".btn").click(function() {
    $(this).blur();
  });
  $(".mainMenuSelectorText").click(function(el) {
    if($(this).parent().hasClass("underConstruction"))
      return;
    else {
      $("#mainMenu").fadeOut(500);
      setTimeout(function() {
        $("#"+el.currentTarget.innerText).removeClass("hide").fadeOut(1);
        $("#"+el.currentTarget.innerText).css("background-color", $(el.currentTarget).parent().css("background-color"));
        setTimeout(function() {
          $("#"+el.currentTarget.innerText).fadeIn(500);
          if(el.currentTarget.innerText === "Głosowanie") {
            timer(5);
          }
        }, 500);
      }, 200);
    }
  });
  /* PYTANIA */
  $("#dodajPytanie").click(function() {
    $("#addQuestionModal").modal({backdrop: "static"});
    var ilosc = parseInt($("#iloscPytan").text());
    $("#iloscPytan").text(++ilosc);
  });
  $("#pytaniaReturnToMainMenu").click(function() {
    $("#Pytania").fadeOut(500);
    setTimeout(function() {
      $("#mainMenu").removeClass("hide").fadeOut(1);
      setTimeout(function() {
        $("#createQuestionList").removeClass("hide").fadeIn(1);
        $("#addBoxCreateQuestionList").addClass("hide").fadeOut(1);
        $("#chooseBoxCreateQuestionList").removeClass("hide").fadeIn(1);
        $("#menuQuestions").addClass("hide").fadeOut(1);
        $("#mainMenu").fadeIn(500);
      }, 500);
    }, 200);
  });
  $("#addQuestionList").click(function() {
    $("#createQuestionList").fadeOut(500);
    setTimeout(function() {
      $("#chooseBoxCreateQuestionList").addClass("hide").fadeIn(1);
      $("#addBoxCreateQuestionList").removeClass("hide");
      setTimeout(function() {
        $("#createQuestionList").fadeIn(500);
      }, 200);
    }, 500);
  });
  $("#submitQuestionList").click(function() {
    var questionListName = $("#questionListName").val();
    // var regex = /[^a-zA-Z0-9- ]/g;
    var regex = /[~`!#$%\^&*+=\\[\]\\';,/{}|\\":<>\?]/g; //oryginal: !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g
    if(regex.test(questionListName)) {
      showSnackbar("Nazwa listy nie może zawierać znaków specjalnych!", 3, $("#submitQuestionList"), "red");
      return;
    }
    $.post("/submitQuestionList", {listName: questionListName}, function(response) {
      console.log(response);
      if(response==="true") {
        showSnackbar("Lista o takiej nazwie już istnieje!", 3, $("#submitQuestionList"), "red");
      }
      else if(response==="false") {
        showSnackbar("Plik z listą pytań został pomyślnie utworzony!", 3, $("#submitQuestionList"), "green");
      }
    });
  });
  $("#returnToChooseBoxQuestionList").click(function() {
    $("#createQuestionList").fadeOut(500);
    setTimeout(function() {
      $("#addBoxCreateQuestionList").addClass("hide").fadeIn(1);
      $("#chooseBoxCreateQuestionList").removeClass("hide");
      setTimeout(function() {
        $("#createQuestionList").fadeIn(500);
      }, 200);
    }, 500);
  });
  $("#importQuestionList").click(function() {
    $("#importQuestionModal").modal({backdrop: "static"});
  });


});

function createQuestion() {
  var wholeQuestion =
    $("#pytanieTextarea").val()+"{||}"+
    $("#odpowiedzTextarea1").val()+"{||}"+
    $("#odpowiedzTextarea2").val()+"{||}"+
    $("#odpowiedzTextarea3").val()+"{||}"+
    $("#odpowiedzTextarea4").val()+"{||}"+
    $("input[name=correctAnswer]:checked").val()+"{||}";
  wholeQuestion = wholeQuestion.replace(/\n/g, "{-}") + "\n";
  console.log(wholeQuestion);
  $.post("/createQuestion", {question: wholeQuestion}, function(data) {
    // alert(json);
    console.log(data);
    // console.log(something);
  });
}

function loadImportQuestionSelectList() {
  //TO ZACZAC ROBIC!!!!
}

function timer(duration) {
  var timer = parseInt(duration)*60;
  var minutes;
  var seconds;
  timerId = setInterval(function() {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    $(".timer").html(minutes + ":" + seconds);
    if(--timer < 0) {
      alert("Timer stopped!");
      clearInverval(timerId); ///CZEMU TO NIE DZIALA?????
    }
  }, 1000);
}

function showSnackbar(text, seconds, button, color) {
  clearTimeout(snackbarTimerId);
  switch(color) {
    case "blue1": color = "#8fa5f1"; break;
    case "blue2": color = "#6282f2"; break;
    case "blue3": color = "#3b64f2"; break;
    case "blue4": color = "#1849f2"; break;
    case "red": color = "#d9534f"; break;
    case "green": color = "#5cb85c"; break;
    default: color = "#333";
  }
  $("#snackbar").css("background-color", color);
  button.attr("disabled",true);
  $("#snackbar").html(text);
  $("#snackbar").addClass("show");
  snackbarTimerId = setTimeout(function() {
    $("#snackbar").removeClass("show");
    button.attr("disabled",false);
  }, seconds*1000);
}
