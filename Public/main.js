var timerId;
var snackbarTimerId;
var filesWithContent;
var selectedFile;
var selectedQuiz;
var unfilteredSelectedFile;
var socket = io();
var alreadyUsed = [];
var sessionAnswers = [];
var sessionCorrectAnswers = [];
var fixedRemotesUsed;
var remotesUsed;
var remotesKey;
var quizIndex;
var quizing = false;
var students;
var selectedClass;
var everyone_connected = false;
var remotesInQuiz = {};
var correctAnswerForCurrentQuestion;
var remotesCorrectAnswers = {};
var showScoreboardAfterEachQuestion;
var tempShowScoreboardAfterEachQuestion = false;
var showSurvey = false;
var quizIsFinished = false;
var doNotShowNextQuestion = false;

$(document).ready(function() {
  //TO PONIZEJ DO NAPRAWY BUGA W FIREFOXIE!
  $("#submitQuestionList").attr("disabled",false);
  //TO POWYZEJ DO NAPRAWY BUGA W FIREFOXIE!
  //SPRAWDZIC CZY BUG TEN DZIALA W SZKOLE!: PODCZAS WYSWIETLANIA SNACKBARRA Z ERROREM ODSWIEEZYC STRONE!
  loadQuestionsFromFiles(); //laduje pliki z pytaniami do zmiennej i przypina do listy

  $.post("/loadStudents", function (json) {
	students = json;
	console.log(students);
	$("#importQuizStudentsList").empty();
	for(var key in students) {
	  $("#importQuizStudentsList").append(
		"<option>" + key + "</option>"
	  );
	}
  });

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
  /* SMARTPHONE QUIZ */
  var smartphoneQuizGroups = 0;
  $("#loadSmartphoneQuizBtn").click(function() {
	$("#Quiz").addClass('hide');
	$("#smartphoneQuiz").removeClass('hide');
  });
  $("#smartphoneQuizAddGroupBtn").click(function() {
	smartphoneQuizGroups++;
	$("#smartphoneQuizGroupsBox").append(`
	  <div id="smartphoneQuizGroup${smartphoneQuizGroups}" class="panel panel-primary">
		<div class="panel-heading">Grupa ${smartphoneQuizGroups}</div>
		<div class="panel-body">
			<div class="col-xs-6">
				<h2>Pytania</h2>
				<select class="smartphoneQuizGroupsBodySelect"><option>N/A</option></select>
			</div>
			<div class="col-xs-6">
				<h2>Uczniowie</h2>
				<div class="col-xs-12">
					<select id="smartphoneQuizGroup${smartphoneQuizGroups}Select">
						<option value="parzyste">Z numerem parzystym</option>
						<option value="nieparzyste">Z numerem nieparzystym</option>
						<option value="numerki">Z wybranymi numerami</option>
					</select>
				</div>
				<div class="col-xs-12">
					<h3>Numery:</h3>
					<input type="text" id="smartphoneQuizGroup${smartphoneQuizGroups}InputNumbers">
				</div>
			</div>
		</div>
	  </div>
	`);
  });
  $("#smartphoneQuizReloadQuestionsBtn").click(function() {
  	$.post('/loadQuestionsFromFiles', function (json) {
  		$(".smartphoneQuizGroupsBodySelect").empty();
  		for(var key in json) {
  			$(".smartphoneQuizGroupsBodySelect").append("<option>" + key + "</option>");
  		}
  	});
  });
  $("#smartphoneQuizDeleteGroupsBtn").click(function() {
  	smartphoneQuizGroups = 0;
  	$("#smartphoneQuizGroupsBox").empty();
  });
  $("#smartphoneQuizStartQuizBtn").click(function() {
  	var json = {};
  	var length = $('#smartphoneQuizGroupsBox')[0].children.length;
  	if (length !== 0) {
	  	for(var i=0; i<length; i++) {
	  		json[i] = {
	  			plik: $('#smartphoneQuizGroupsBox')[0].children[i].children[1].children[0].children[1].selectedOptions[0].text
	  		};
	  		var thisValue = $('#smartphoneQuizGroupsBox')[0].children[i].children[1].children[1].children[1].children[0].selectedOptions[0].value;
	  		switch(thisValue) {
	  			case 'numerki': {
	  				json[i]['uczniowie'] = thisValue;
	  				json[i]['numerki'] = $('#smartphoneQuizGroupsBox')[0].children[i].children[1].children[1].children[2].children[1].value;
	  			}; break;
	  			default: {
	  				json[i]['uczniowie'] = thisValue;
	  			}; break;
	  		}
	  	}
		console.log(json);
	  	smartphoneQuizGroups = 0;
	  	$("#smartphoneQuizGroupsBox").empty();
	  	socket.emit('testIsReady', json);
	  	/*
			zrobic cos takiego, ze po wcisnieciu autoryzuj na ekranie aplikacji pojawi sie imie, nazwisko, klasa, numer oraz kod
			@kod ma byc chyba tylko liczbowy bo latwo wymowic i albo kod bedzie danego koloru lub obok niego bedzie kwadrat z kolorem
			sprawdzanie:
			Nauczyciel: ${ktos} podaj kod
			${ktos}: zielony 247
			i jezeli kod bedzie sie zgadzac z tym co na kompie to wtedy mamy przypisane id telefonu wiec brak mozliwosc oszukiwania
			+ zrobic jeszcze jakis lepszy przycisk autoryzacji czy cos xD
			#wykorzystac przycisk ladowania (animal.gif tylko moze w innym kolorze???? fajnie by to wygladalo)
	  	*/
  	}
  	else {
  		showSnackbar('Najpierw dodaj grupy!', 3, $("#smartphoneQuizStartQuizBtn"), 'red');
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
  remotesKey = "4-.-2";
  $(".editBtn").click(function(btn) {
	console.log(btn.currentTarget.parentNode.parentNode);
  });
  //zielone kolorki w radiach
  $(".radio-inline [name=showResultsAfterQuestion]").on("change", function(e) {
	$(".showResultsAfterQuestionLabel.greenyellowFont").removeClass("greenyellowFont");
	$(e.target.parentElement).addClass("greenyellowFont");
  });
  $(".radio-inline [name=quizType]").on("change", function(e) {
	$(".quizTypeLabel.greenyellowFont").removeClass("greenyellowFont");
	$(e.target.parentElement).addClass("greenyellowFont");
  });
  //koniec ^
  $("body, html").keypress(function (e) {
	if (e.keyCode == "32") {
	  if (showScoreboardAfterEachQuestion && !tempShowScoreboardAfterEachQuestion) {
		doNotShowNextQuestion = false;
		$("#showScoreboardAfterEachQuestionButton").click();
	  }
	} 
  });
  // QUIZ:
  $("#loadQuizSelectList").click(function() {
	var classCount;
	var selected = $("#importQuizSelectList").find(":selected").text();
	showScoreboardAfterEachQuestion = ($("input[name=showResultsAfterQuestion]:checked").val() == "true");
	showSurvey = ($("input[name=quizType]:checked").val() == "ankieta");
	selectedQuiz = {};
	var foo = [];
	var tempFoo = [];
	selectedQuiz[selected] = filesWithContent[selected+".txt"].split("{V}");
	for(var key in selectedQuiz) {
	  for(var i=0; i<selectedQuiz[key].length; i++) {
		foo[i] = selectedQuiz[key][i].split("{||}");
		tempFoo[i] = selectedQuiz[key][i].split("{||}");
	  }
	  console.log(selectedQuiz[key]);
	}
	foo.pop();
	tempFoo.pop();
	for(var j=0; j<foo.length; j++) {
	  console.log('foring...');
	  for(var jk=0; jk<foo[j].length; jk++) {
		foo[j][jk] = foo[j][jk].replace(/{-}/g, "<br>");
	  }
	  for(var jk=0; jk<foo[j].length; jk++) {
		foo[j][jk] = foo[j][jk].replace(/{i}/g, "<img class='img-thumbnail img-responsive' style='margin-bottom: 15px; margin-top:15px; max-height: 30vh;' src='");
		foo[j][jk] = foo[j][jk].replace(/{I}/g, "'>")
	  }

	  sessionAnswers.push([0, 0, 0, 0]);
	  sessionCorrectAnswers.push([]);
	}
	unfilteredSelectedFile = tempFoo;
	selectedQuiz = foo;
	console.log(selectedQuiz);
	console.log(foo);
	// console.log(sessionAnswers);
	// console.log(sessionCorrectAnswers);
	remotesUsed = $("input[name=howMuchRemotes]").val();
	fixedRemotesUsed = remotesUsed;
	quizing = true;
	quizIndex = 0;
	selectedClass = $("#importQuizStudentsList").find(":selected").text();
	classCount = students[selectedClass].length;
	reloadVoters(fixedRemotesUsed);
	//CONNECTIONS:
	$("#Quiz").addClass('hide');
	setTimeout(function() {
	  $("#Quiz").removeClass('hide');
	}, 2500);
	$("#loadQuizingDevices").modal({backdrop: "static"});
	$("#loadQuizingDevicesMax").html(fixedRemotesUsed);
	//resszta:
	loadQuestionAndAnswersFromQuiz(selectedQuiz, quizIndex);
	$("#selectQuizWrapper").addClass("hide");
	$("#quizMainWrapper").removeClass("hide");
	socket.emit('everyone_connected', false, remotesInQuiz);
  });
  $("#loadQuizingDevicesStartQuiz").click(function() {
  	timer();
	everyone_connected = true;
	socket.emit('send question to device', 1, unfilteredSelectedFile[0], remotesInQuiz);
	console.log(remotesInQuiz);
	socket.emit('everyone_connected', true, remotesInQuiz);
  });
  //ODPOWIADANIE NA PYTANIA
  socket.on("emitTranslatedCode", function(pilotId, code) {
	// console.log("TESTING: "+pilotId+" with code "+code);
	if(quizing) {
	  if(!everyone_connected) {
		if (code.slice(0,2) === "./" && /^\d+$/.test(code.slice(2))) {
		  if (!remotesInQuiz.hasOwnProperty(code.slice(2))) {
			if (Object.keys(remotesInQuiz).length == fixedRemotesUsed && remotesInQuiz.hasOwnProperty(pilotId)) {
			  remotesInQuiz[pilotId] = code.slice(2);
			  console.log(remotesInQuiz); 
			  var keysRemotesInQuiz = Object.keys(remotesInQuiz);
			  $("#loadQuizingDevicesConnectedSpan").html(keysRemotesInQuiz.length);
			  $("#connectedDevices").empty();
			  //dodac 12 kolumn, gdzie numerki beda szly od lewej do prawej
			  var temp = Object.keys(remotesInQuiz).sort(function(a,b){return remotesInQuiz[a]-remotesInQuiz[b]});
			  //http://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value
			  for(var k=0; k<temp.length; k++) {
				$("#connectedDevices").append('<div class="col-xs-3 connectedDevice" id="connectedDevice'+(k+1)+'">'+remotesInQuiz[temp[k]]+'</div>');
			  }
			  reloadVoters(fixedRemotesUsed);
			}
			else if (Object.keys(remotesInQuiz).length < fixedRemotesUsed) {
				console.log(Object.keys(remotesInQuiz).length + "<=" + fixedRemotesUsed);
			  remotesInQuiz[pilotId] = code.slice(2);
			  remotesCorrectAnswers[pilotId] = {points: 0};
			  console.log(remotesCorrectAnswers);
			  console.log(remotesInQuiz); 
			  var keysRemotesInQuiz = Object.keys(remotesInQuiz);
			  $("#loadQuizingDevicesConnectedSpan").html(keysRemotesInQuiz.length);
			  $("#connectedDevices").empty();
			  //dodac 12 kolumn, gdzie numerki beda szly od lewej do prawej
			  var temp = Object.keys(remotesInQuiz).sort(function(a,b){return remotesInQuiz[a]-remotesInQuiz[b]});
			  //http://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value
			  for(var k=0; k<temp.length; k++) {
				$("#connectedDevices").append('<div class="col-xs-3 connectedDevice" id="connectedDevice'+(k+1)+'">'+remotesInQuiz[temp[k]]+'</div>');
			  }
			  if (keysRemotesInQuiz.length == fixedRemotesUsed) {
				$("#loadQuizingDevicesStartQuiz").attr("disabled", false);
				$("#loadQuizingDevicesStartQuiz").removeClass("btn-danger");
				$("#loadQuizingDevicesStartQuiz").addClass("btn-success");
				reloadVoters(fixedRemotesUsed);
			  }
			}
		  }
		}
	  }
	  else {
		// console.log(pilotId, code);
		if(alreadyUsed.indexOf(pilotId) !== -1)
		  console.log("pilot was already used!");
		else {
		  // console.log("Code sent by pilot "+pilotId+" :"+code);
		  console.log("Pilot with id "+pilotId+" was used!", code);
		  if(pilotId === "80c0" && code === "03") {
			console.log("BREAK!!!!");
			loadQuestionAndAnswersFromQuiz(selectedQuiz, quizIndex);
			reloadVoters(fixedRemotesUsed);
			// $("#quizMainBox").addClass("hide");
			// $("#resultsAfterQuiz").removeClass("hide");
			// $("#resultsAfterQuiz").html(
			//   "Na odpowiedz 1 glosu udzielilo: "+sessionAnswers[0]+" osob!<br>"+
			//   "Na odpowiedz 2 glosu udzielilo: "+sessionAnswers[1]+" osob!<br>"+
			//   "Na odpowiedz 3 glosu udzielilo: "+sessionAnswers[2]+" osob!<br>"+
			//   "Na odpowiedz 4 glosu udzielilo: "+sessionAnswers[3]+" osob!<br>"
			// );
		  }
		  else if(((code>=1 && code<=4 && remotesInQuiz.hasOwnProperty(pilotId)) || (code === remotesKey && remotesInQuiz.hasOwnProperty(pilotId))) && !doNotShowNextQuestion) {
			if(code >=1 && code <=4) 
			  sessionAnswers[quizIndex-1][code-1]++;
			else if(code === remotesKey)
			  sessionAnswers[quizIndex-1][correctAnswerForCurrentQuestion-1]++;
			console.log(sessionAnswers[quizIndex-1]);
			if(parseInt(code) === parseInt(selectedQuiz[quizIndex-1][5]) || code === remotesKey) {
				// sessionCorrectAnswers[quizIndex-1]++;
				sessionCorrectAnswers[quizIndex-1].push(pilotId);
				remotesCorrectAnswers[pilotId]["points"]++;
				console.log(remotesCorrectAnswers);
			}

			alreadyUsed.push(pilotId);
			// $("#voted") DODAC LISTE USEROW!
			remotesUsed--;
			console.log(remotesUsed);
			// switch(pilotId) {
			//   case "1796": $("#votedUser1").addClass("hide"); break;
			//   case "1c08": $("#votedUser2").addClass("hide"); break;
			//   case "1aef": $("#votedUser3").addClass("hide"); break;
			//   case "177d": $("#votedUser4").addClass("hide"); break;
			//   case "19f0": $("#votedUser5").addClass("hide"); break;
			//   case "11d3": $("#votedUser6").addClass("hide"); break;
			//   case "19c4": $("#votedUser7").addClass("hide"); break;
			//   case "13d5": $("#votedUser8").addClass("hide"); break;
			//   case "1c52": $("#votedUser9").addClass("hide"); break;
			//   case "19e7": $("#votedUser10").addClass("hide"); break;
			// }
			$("#votedUser"+pilotId).addClass("hide");
			if(remotesUsed <= 0) {
			  loadQuestionAndAnswersFromQuiz(selectedQuiz, quizIndex);
			  reloadVoters(fixedRemotesUsed);
			  // $("#quizMainBox").addClass("hide");
			  // $("#resultsAfterQuiz").removeClass("hide");
			  // $("#resultsAfterQuiz").html(
			  //   "Na odpowiedz 1 glosu udzielilo: "+sessionAnswers[0]+" osob!<br>"+
			  //   "Na odpowiedz 2 glosu udzielilo: "+sessionAnswers[1]+" osob!<br>"+
			  //   "Na odpowiedz 3 glosu udzielilo: "+sessionAnswers[2]+" osob!<br>"+
			  //   "Na odpowiedz 4 glosu udzielilo: "+sessionAnswers[3]+" osob!<br>"
			  // );
			}
		  }
		}  
	  }
	}
  });



});

function reloadVoters(voters) {
  // $("#alreadyVotedBox").html("");
  remotesUsed = voters;
  alreadyUsed = [];
  /*for(var k=0; k<voters; k++) {
	$("#votedUser"+(k+1)).remove();
	console.log("votedUser"+(k+1));
	$("#alreadyVotedBox").append('<div class="col-xs-1" id="votedUser'+(k+1)+'">U'+(k+1)+'</div>');
	$("#votedUser"+(k+1)).removeClass("hide");
  }*/
  var temp = Object.keys(remotesInQuiz).sort(function(a,b){return remotesInQuiz[a]-remotesInQuiz[b]});
  var physicalRemotes = [
  	'1796',
  	'1c08',
  	'1aef',
  	'177d',
  	'19f0',
  	'11d3',
  	'19c4',
  	'13d5',
  	'1c52',
  	'19e7'
  ];
  //http://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value
  for(var i=0; i<temp.length; i++) {

	$("#votedUser"+temp[i]).remove();
	if(physicalRemotes.indexOf(temp[i]) !== -1)
		$("#alreadyVotedBox").append('<div class="col-xs-1 votedUserPhysicalRemotes" id="votedUser'+temp[i]+'">'+remotesInQuiz[temp[i]]+'</div>');
	else
		$("#alreadyVotedBox").append('<div class="col-xs-1" id="votedUser'+temp[i]+'">'+remotesInQuiz[temp[i]]+'</div>');
	$("#votedUser"+temp[i]).removeClass("hide");
  }
}

function loadQuestionAndAnswersFromQuizANDreloadVoters() {
  loadQuestionAndAnswersFromQuiz(selectedQuiz, quizIndex, true);
  reloadVoters(fixedRemotesUsed);
}

function loadQuestionAndAnswersFromQuiz(file, index, nextQuestion) {
  if (!quizIsFinished) {
	if((index === file.length || tempShowScoreboardAfterEachQuestion) && nextQuestion === undefined) {
	  tempShowScoreboardAfterEachQuestion = false;
	  if (index === file.length) {
		quizIsFinished = true;
		var points = {};
		for(var key in remotesInQuiz) {
		  points[key] = Math.ceil(remotesCorrectAnswers[key]["points"] / index * 100);
		}
		socket.emit('quizIsFinished', quizIsFinished, {
		  students: students[selectedClass],
		  points: points
		});
	  }
	  //OVERFLOW DO QUIZ!:
	  $("#Quiz").css("overflow", "auto");
	  console.log(sessionAnswers);
	  $("#quizMainBox").addClass("hide");
	  if (index === file.length && showScoreboardAfterEachQuestion) {
		$("#resultsAfterQuiz").empty().html("<h1>Wyniki Quizu po wszystkich pytaniach</h1><hr>");
	  }
	  else if (showScoreboardAfterEachQuestion) {
		doNotShowNextQuestion = true;
		$("#resultsAfterQuiz").empty().html("<h1>Wyniki Quizu po pytaniu: <span style='color: greenyellow; font-size: 1.3em'>" + quizIndex +"</span><br><button id='showScoreboardAfterEachQuestionButton' type='button' class='btn btn-primary btn-lg hide' onclick='loadQuestionAndAnswersFromQuizANDreloadVoters()'>następne pytanie (spacebar)</button></h1><hr>");
	  }
	  $("#resultsAfterQuiz").removeClass("hide");
	  // for(let i=0; i<sessionAnswers.length; i++) {
	  //   var correctAnswersForQuestion = 0;
	  //   for(var j=0; j<sessionAnswers[i].length; j++) {
	  //     console.log(sessionAnswers[i][j]+" === "+parseInt(selectedQuiz[i][5]));
	  //     if(sessionAnswers[i][j] === parseInt(selectedQuiz[i][5])) {
	  //       console.log("correct");
	  //       correctAnswersForQuestion = selectedQuiz[i][5];
	  //     }
	  //   }
	  //   $("#resultsAfterQuiz").append(
	  //     // "Pytanie "+(i+1)+": "+sessionAnswers[i]+"<br>"
	  //     "Na pytanie "+(i+1)+" poprawej odpowiedzi udzielilo: "+sessionCorrectAnswers[i]+"<br>"
	  //   );
	  // }
	  var quizingStudents = [];
	  var pilotsSorted = [];
	  for(key in remotesInQuiz) {
		quizingStudents.push(parseInt(remotesInQuiz[key]));
		// pilotsSorted.push(key);
	  }
	  quizingStudents.sort(function (a, b) {
		return a - b;
	  });
	  for(var i=0; i<quizingStudents.length; i++) {
		for(key in remotesInQuiz) {
		  if (remotesInQuiz[key] == quizingStudents[i])
			pilotsSorted.push(key);
		}
	  }
	  console.log(quizingStudents);
	  if (!showSurvey) {
	  	var savedResults = [];
		  for(var i=0; i<quizingStudents.length; i++) {
			var temp = "uzyskał/a";
			if(students[selectedClass][quizingStudents[i]] !== undefined) {
			  if (students[selectedClass][quizingStudents[i]].split(' ')[0].slice(-1) === 'a')
				temp = "uzyskała";
			  else
				temp = "uzyskał";
			}
		  	$("#resultsAfterQuiz").append('<div class="col-xs-12 col-md-12">' + students[selectedClass][quizingStudents[i]] + ' (<span class="resultStudentsNumber">' + quizingStudents[i] + '</span>): <span class="resultCorrectAnswerForQuestionSpan">' + Math.ceil(remotesCorrectAnswers[pilotsSorted[i]]["points"] / index * 100) + '%</span><br><br></div>');
			console.log(`${remotesCorrectAnswers[pilotsSorted[i]]["points"]} / ${index} = ${Math.ceil(remotesCorrectAnswers[pilotsSorted[i]]["points"] / index * 100)}% | ${remotesCorrectAnswers[pilotsSorted[i]]["points"] / index * 100}%`)
		  	savedResults.push(students[selectedClass][quizingStudents[i]] + " (" + quizingStudents[i] + "): " + Math.ceil(remotesCorrectAnswers[pilotsSorted[i]]["points"] / index * 100) + "%");
		  }
		 // $.post('/savedResults', {savedResults: JSON.stringify(savedResults)});
		 $.post('/savedResults', {results: JSON.stringify(savedResults)});
	  }
	  else {
	  	console.log(`quiz is finished: ${quizIsFinished}`);
	  	if(showSurvey && quizIsFinished) { //koniec ankiety
	  		console.log('TOTALLY TRUE!');
	  		var allAnswers = [0, 0, 0, 0];
	  		var sum =0;
	  		for(var i=0; i<sessionAnswers.length; i++) {
				for(var j=0; j<4; j++) {
					sum += sessionAnswers[i][j];
					allAnswers[j] += sessionAnswers[i][j];
				}
			}
			console.log(`sum: ${sum}`);
			console.log(`all answers: ${allAnswers}`);
			console.log(allAnswers);
			for(var i=0; i<4; i++) {
				$("#resultsAfterQuiz").append(`<div class="col-xs-12 col-md-12">Na odpowiedź <span class="resultCorrectAnswerForQuestionSpan">${i+1}</span> odpowiedzi udzieliło <span class="resultCorrectAnswerForQuestionSpan">${Math.round((allAnswers[i] / sum) * 100)}%</span> osób</div>`);
			}
		  
		}
		else if(showSurvey && !quizIsFinished) { //w trakcie ankiety
			console.log('TOTALLY FALSE!');
			var sum = 0;
			console.log(sessionAnswers);
			console.log(`index: ${index}`);
			for(var i=0; i<4; i++) {
				sum += sessionAnswers[index-1][i];
			}
			console.log(`sum: ${sum}`);
			for(var i=0; i<4; i++) {
				$("#resultsAfterQuiz").append(`<div class="col-xs-12 col-md-12">Na odpowiedź <span class="resultCorrectAnswerForQuestionSpan">${i+1}</span> odpowiedzi udzieliło <span class="resultCorrectAnswerForQuestionSpan">${Math.round((sessionAnswers[index-1][i]/sum) * 100)}%</span> osób</div>`);
			}
		}
	  }

	}
	else {
	  if (!doNotShowNextQuestion) {
	  	timer();
		quizIndex++;
		console.log(unfilteredSelectedFile);
		socket.emit('send question to device', quizIndex, unfilteredSelectedFile[index], remotesInQuiz);
		$("#Quiz").css("overflow", "hidden");
		$("#quizMainBox").removeClass("hide");
		$("#resultsAfterQuiz").addClass("hide");
		$("#questionQuizMainBox").html(quizIndex + ". " + file[index][0]);
		for(var i=1; i<5; i++) {
		  $("#answer"+i+"QuizMainBox").html(i + ". " + file[index][i]);
		}
		// console.log(quizIndex + " QUIZ INDEX!!!");
		correctAnswerForCurrentQuestion = parseInt(file[index][5]);
		console.log("POPRAWNA ODPOEIDZ: "+file[index][5]);
		if (showScoreboardAfterEachQuestion) {
		  tempShowScoreboardAfterEachQuestion = true;
		}
	  }
	}
  }
}

function createQuestion() {
  var odpowiedzi = [
	$("#pytanieTextarea").val(),
	$("#odpowiedzTextarea1").val(),
	$("#odpowiedzTextarea2").val(),
	$("#odpowiedzTextarea3").val(),
	$("#odpowiedzTextarea4").val()
  ];
  $.post('/checkIfAnswersAreUrl', {questions: odpowiedzi}, function(data) {
	var wholeQuestion = "";
	data.forEach(function(q) {
	  wholeQuestion += q + "{||}";
	});
	wholeQuestion += $("input[name=correctAnswer]:checked").val()+"";
	// var wholeQuestion =
	//   $("#pytanieTextarea").val()+"{||}"+
	//   $("#odpowiedzTextarea1").val()+"{||}"+
	//   $("#odpowiedzTextarea2").val()+"{||}"+
	//   $("#odpowiedzTextarea3").val()+"{||}"+
	//   $("#odpowiedzTextarea4").val()+"{||}"+
	//   $("input[name=correctAnswer]:checked").val()+"";
	wholeQuestion = wholeQuestion.replace(/\n/g, "{-}") + "{V}\n";
	var file = Object.keys(selectedFile)[0];
	console.log(wholeQuestion);
	$("#iloscPytan").text(parseInt($("#iloscPytan").html())+1);
	$.post("/createQuestion", {file: file, question: wholeQuestion});
  });
}

function loadQuestionsFromFiles() {
  $.post("/loadQuestionsFromFiles", function(json) {
	if(!jQuery.isEmptyObject(json)) {
	  $("#importQuestionSelectList").empty();
	  $("#importQuizSelectList").empty();
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

/*function timer(duration) {
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
}*/

function timer() {
  clearInterval(timerId);
  var timer = 1;
  var minutes, seconds;
  $("#questionQuizTimer").text("00:00");
  timerId = setInterval(function() {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);
	minutes = minutes < 10 ? "0" + minutes : minutes;
	seconds = seconds < 10 ? "0" + seconds : seconds;
    ++timer;
    $("#questionQuizTimer").text(minutes + ":" + seconds);
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
