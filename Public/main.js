var timerId;
var snackbarTimerId;
var filesWithContent;
var selectedFile;
var selectedQuiz;

$(document).ready(function() {
  //TO PONIZEJ DO NAPRAWY BUGA W FIREFOXIE!
  $("#submitQuestionList").attr("disabled",false);
  //TO POWYZEJ DO NAPRAWY BUGA W FIREFOXIE!
  //SPRAWDZIC CZY BUG TEN DZIALA W SZKOLE!: PODCZAS WYSWIETLANIA SNACKBARRA Z ERROREM ODSWIEEZYC STRONE!
  loadQuestionsFromFiles(); //laduje pliki z pytaniami do zmiennej i przypina do listy
  $(".btn").click(function() {
    $(this).blur();
  });
  $(".mainMenuSelectorText").click(function(el) {
    if($(this).parent().hasClass("underConstruction"))
      return;
    else {
      $("#mainMenu").fadeOut(500);
      $("body").css("background-color", $(el.currentTarget).parent().css("background-color"));
      setTimeout(function() {
        $("#"+el.currentTarget.innerText).removeClass("hide").fadeOut(1);
        $("#"+el.currentTarget.innerText).css("background-color", $(el.currentTarget).parent().css("background-color"));
        setTimeout(function() {
          loadQuestionsFromFiles();
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
    $("#iloscPytan").text(ilosc);
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
        loadQuestionsFromFiles();
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
    if(filesWithContent === false) {
      showSnackbar("Brak plików w lokalizacji! Stwórz jakiś!", 3, $("#importQuestionList"), "red");
    }
    else {
      $("#importQuestionModal").modal({backdrop: "static"});
    }
  });
  $("#loadSelectedQuestionList").click(function() {
    var selected = $("#importQuestionSelectList").find(":selected").text();
    console.log(selected);
    selectedFile = {};
    selectedFile[selected] =  filesWithContent[selected+".txt"];
    console.log(selectedFile);
    var splittedContent = selectedFile[Object.keys(selectedFile)[0]].split("\n");
    console.log(splittedContent);
    $("#iloscPytan").text(splittedContent.length-1);
    //Appending:
    for(var i=0; i<splittedContent.length-1; i++) {
      console.log("wat");
      $("#questionsAccordion").append(
        '<div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" data-parent="#questionsAccordion" href="#collapse'+i+'">Tutaj wstawic string pytanie z pliku</a></h4></div><div id="collapse'+i+'" class="panel-collapse collapse"><div class="panel-body">'+splittedContent[i]+'</div></div></div>');
    }

    // Wczytanie:
    $("#createQuestionList").fadeOut(500);
    $("#mainMenuQuestions").fadeOut(1);
    setTimeout(function() {
      $("#createQuestionList").addClass("hide").fadeIn(1);
      $("#mainMenuQuestionsWrapper").removeClass("hide").fadeIn(1);
      setTimeout(function() {
        $("#mainMenuQuestions").fadeIn(500);
      }, 200);
    }, 500);
  });
  $(".editBtn").click(function(btn) {
    console.log(btn.currentTarget.parentNode.parentNode);
  });
  // QUIZ:
  $("#loadQuizSelectList").click(function() {
    var selected = $("#importQuizSelectList").find(":selected").text();
    selectedQuiz = {};
    selectedQuiz[selected] = filesWithContent[selected+".txt"];
    console.log(selectedQuiz);
    for(var key in selectedQuiz) {
      $("#quizMainWrapper").append(
        selectedQuiz[key].replace(/{-}/g,"<br>").replace(/{V}/g, "<br><br>")
        //DODAC DO FROMATOWANIA KONIEC PYTANIA!!!! czyli chyba {V}
      );

    }
    $("#selectQuizWrapper").addClass("hide");
    $("#quizMainWrapper").removeClass("hide");
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
  var file = Object.keys(selectedFile)[0];
  console.log(wholeQuestion);
  $("#iloscPytan").text(parseInt($("#iloscPytan").html())+1);
  $.post("/createQuestion", {file: file, question: wholeQuestion}, function(data) {
    // alert(json);
    console.log(data);
    // console.log(something);
  });
}

function loadQuestionsFromFiles() {
  $.post("/loadQuestionsFromFiles", function(json) {
    if(!jQuery.isEmptyObject(json)) {
      filesWithContent = json;
      console.log(filesWithContent);
      // console.log(filesWithContent["Historia.txt"].split("\n").length-1);
      for(var key in filesWithContent) {
        console.log(key);
        $("#importQuestionSelectList").append(
          "<option>"+key.slice(0,-4)+"</option>"
        );
        $("#importQuizSelectList").append(
          "<option>"+key.slice(0,-4)+"</option>"
        );
      }
    }
    else {
      filesWithContent = false;
    }
  });
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
