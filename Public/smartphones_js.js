let socket = io();
let students;
$(document).ready(function() {
	socket.on('question', json => {
		confirmId(function() {
			$("#sendBtn").attr('disabled', false);
			htmlQuestion(json);
		}, function() {
			if (!$("#mimicQuizBoxAnswer").hasClass('hide'))
				$("#mimicQuizBox").addClass('hide'); 
		});
	});
	socket.on('everyoneConnected', bool => {
		everyoneConnected(bool);
	});
	socket.on('quizIsFinished', (bool, json) => {
		console.log('quiz is finished!');
		let deviceId = $("#kbdDeviceId").text();
		console.log(deviceId);      
		console.log('id is confirmed! Time to show score!');
		if (Object.keys(json['points']).indexOf(deviceId) !== -1) {
			let name = json['students'][$("#kbdNumber").text()];
			let nameArr = name.split(' ');
			let temp;
			if (nameArr[0].slice(-1) === 'a')
				temp = 'uzyskałaś';
			else
				temp = 'uzyskałeś';
			$("#afterMimicResultsName").html(`Gratulacje! ${temp}:<br>`);
			$("#afterMimicResultsScore").html(`${json['points'][deviceId]}%`);
			$("#mimicQuizBox").addClass('hide');
			$("#mimicWaitingForData").addClass('hide');
			$("#afterMimicResults").removeClass('hide');                  
		}
	});
	$.post('/smartphoneSetCookiesAndStudents', function (json) {
		students = json['students'];
		if(json['user'] !== undefined) {
			let user = JSON.parse(json['user']);
			if (user['username'] !== undefined && user['userclass'] !== undefined && user['usernumber'] !== undefined) {
				loadUser(user['username'], user['userclass'], user['usernumber']);
			}
			else {
				$("#chooseClass").removeClass("hide");
				updateSettings(['mimicMainApp', 'selfQuizingMode'], [false, false]);
			}
		}
		else {
			updateSettings(['mimicMainApp', 'selfQuizingMode'], [false, false]);
			$("#classList").empty();
			for(let key in students) {
				$("#classList").append("<option>" + key + "</option>");
			}
			$("#chooseClass").removeClass("hide");
		}
		$("#kbdDeviceId").html(json['userData']['deviceId']);
		$("#kbdIP").html(json['userData']['ip']);
		$("#kbdSoftware").html(json['userData']['software']);
	});
	$("#confirmClassList").click(function() {
		$("#studentsList").empty();
		for(let key in students[$("#classList").find(":selected").text()]) {
			$("#studentsList").append("<option>" + key + "</option>");
		}
	});
	$("#confirmStudentsList").click(function() {
		$("#imieNazwisko").text(students[$("#classList").find(":selected").text()][$("#studentsList").find(":selected").text()]);
		if ($("#studentsList").find(":selected").text() !== "N/A") {
			if ($("#confirmButton").is(":disabled"))
				$("#confirmButton").attr("disabled", false);
		}
	});
	$("#confirmButton").click(function() {
		let username = $("#imieNazwisko").text();
		let userclass = $("#classList").find(":selected").text();
		let usernumber = $("#studentsList").find(":selected").text();
		let json = {
			'name': username, 
			'class': userclass, 
			'number': usernumber
		};
		$.post("/smartphoneSetUser", json);
		loadUser(username, userclass, usernumber);
	});
	$("#sendBtn").click(function(e) {
		if (e.target.attributes['disabled'] === undefined) {
			let inputBox = $("#inputBox").text();
			if (parseInt(inputBox) >=1 && parseInt(inputBox)<=4) {
				$("#sendBtn").attr('disabled', true);
			}
			$.post("/smartphoneSendCode", {'code': inputBox});
		}
	});
	$(".authorizeBtn").click(function(e) {
		if (e.target.attributes['disabled'] === undefined) {
			$.post("/smartphoneSendCode", {'code': './' + $("#confirmedNumber").text()}, function (err) {
			  if (err) throw err;
			 });
			if (e.target.parentElement.id === 'mimicWrapper' && $('.waitingForData').hasClass('hide')) {
				$(".waitingForData").removeClass('hide');
			}                   
		}
	});
	$(".btn.sendable").click(function(e) {
		let value = e.target.attributes['value'].value;
		console.log($(this));
		console.log(value);
		let inputBox = $("#inputBox").text();
		switch (value) {
			case "C": {
				if (inputBox.length > 0) {
					$("#inputBox").text(inputBox.slice(0, -1));
				}
			}; break;
			default: {
				if (inputBox.length < 6) {
					inputBox += value;
					$("#inputBox").text(inputBox);
				}
			}; break;
		}
	});
	$(".userBtn").click(function() {
		$("#userModal").modal({backdrop: "static"});
	});
	$(".optionsBtn").click(function() {
		$("#optionsModal").modal({backdrop: "static"});
	});
	$("#deleteCookiesBtn").click(function() {
		$("#deleteCookiesBtn").addClass("hide");
		$("#deleteCookiesConfirmationBox").removeClass("hide");
	});
	$("#confirmDeletingCookies").click(function() {
		$.post("/smartphoneDeleteCookies", function() {
			location.reload(true);
		});
	});
	$(".declineDeletingCookies").click(function() {
		$("#deleteCookiesBtn").removeClass("hide");
		$("#deleteCookiesConfirmationBox").addClass("hide");
	});

	$(".settingsCheckbox").on("change", function(e) {
		let json = {
			bool: $(`input[name=${e.target.name}]`).is(":checked"),
			name: e.target.name
		};
		switch(json['name']) {
			case 'mimicMainApp': {
				if (json['bool']) {
					if ($('input[name=selfQuizingMode]').is(':checked')) {
						$(`div[name=selfQuizingMode`).click();
					}
					$("#remoteWrapper").addClass("hide");
					$("#selfQuizWrapper").addClass('hide');
					$("#mimicWrapper").removeClass("hide");
				}
				else if (!json['bool']) {
					$("#remoteWrapper").removeClass("hide");
					$("#mimicWrapper").addClass("hide");
					$("#selfQuizWrapper").addClass("hide");
				}
				updateSettings(['mimicMainApp', 'selfQuizingMode'], [$('input[name=mimicMainApp]').is(':checked'), $('input[name=selfQuizingMode]').is(':checked')]);
			}; break;
			case 'selfQuizingMode': {
				if (json['bool']) {
					if ($('input[name=mimicMainApp]').is(':checked')) {
						$(`div[name=mimicMainApp`).click();
					}
					$("#remoteWrapper").addClass("hide");
					$("#selfQuizWrapper").removeClass('hide');
					$("#mimicWrapper").addClass("hide");
				}
				else if (!json['bool']) {
					$("#remoteWrapper").removeClass('hide');
					$("#mimicWrapper").addClass("hide");
					$("#selfQuizWrapper").addClass("hide");
				}
				updateSettings(['mimicMainApp', 'selfQuizingMode'], [$('input[name=mimicMainApp]').is(':checked'), $('input[name=selfQuizingMode]').is(':checked')]);
			}; break;
		}
	});
	$("#reloadQuestionBtn").click(function() {
		reloadQuestion();
	});


	$(".mimicQuizBoxAnswer").click(function(e) {
		let code;
		if (e.target.className.indexOf('img-responsive') !== -1) {        
			code = e.target.parentElement.id.slice(-1);
		}
		else {
			code = e.target.id.slice(-1)
		}
		$("#mimicWaitingForData").removeClass('hide');
		$("#mimicQuizBox").addClass('hide');
		$.post("/smartphoneSendCode", {'code': code});
	});

	function loadUser(username, userclass, usernumber) {
		$("#chooseClass").addClass('hide');
		$("#confirmedYou, #kbdYou").text(username);
		$("#confirmedClass, #kbdClass").text(userclass);
		$("#confirmedNumber, #kbdNumber").text(usernumber);
		$("#remoteWrapper").removeClass("hide");
		$("#remoteWrapper").css('display', 'none');
		readSettings();
	};

	function confirmId(callbackTrue, callbackFalse) {
		$.post('/smartphoneConfirmId', json => {
			if (json.bool)
				callbackTrue(json.deviceId);
			else {
				if (callbackFalse !== undefined)
					callbackFalse(json.deviceId);
			}
		});
	}

	function htmlQuestion(json) {
		$("#idPytania").text(json['index']);
		$("#mimicQuizBoxQuestion").html(json['question'][0]);
		for(let i=1; i<5; i++) {
			if (!$(`#mimicQuizBoxAnswer${i}`).hasClass('mimicQuizBoxBorder')) {
				$(`#mimicQuizBoxAnswer${i}`).addClass('mimicQuizBoxBorder');
			}
			if (json['question'][i].indexOf('{i}') !== -1) {
				$(`#mimicQuizBoxAnswer${i}`).removeClass('mimicQuizBoxBorder');
			}
			json['question'][i] = json['question'][i].replace(/{i}/g, '<img class="img-responsive img-thumbnail" src="');
			json['question'][i] = json['question'][i].replace(/{I}/g, '">')
			$(`#mimicQuizBoxAnswer${i}`).html(json['question'][i]);
		}
		$("#mimicWaitingForData").addClass('hide');
		$("#mimicQuizBox").removeClass('hide');
	}

	function everyoneConnected(bool) {
		if (bool) {
			confirmId(function() {
				if (!$("#mimicWaitingForData").hasClass('hide')) {
					$("#mimicWaitingForData").addClass('hide');
				}
				$("#mimicWaitingForData").addClass('hide');
				$("#mimicQuizBox").removeClass('hide');
				$(".authorizeBtn").attr('disabled', true);
			});
		}
		else {
			$(".authorizeBtn").removeAttr('disabled');
			$(".authorizeBtn").prop('disabled', false);
			$(".authorizeBtn").attr('disabled', false);
			$("#mimicQuizBox").addClass('hide');
			$("#mimicWaitingForData").addClass('hide');
			$("#afterMimicResults").addClass('hide');
		}
	}

	function reloadQuestion() {
		$.post('/smartphoneReloadQuestion', function (json) {
			if (json !== undefined) {
				confirmId(function() {
					console.log(json);
					htmlQuestion(json);
					everyoneConnected(true); 
				});
			}
		});
	};

	function updateSettings(setting, value) {
		if (setting !== undefined && value !== undefined) {
			$.post('/smartphoneSetSettings', {setting: setting, value: value});
		}
	};

	function readSettings() {
		$.post('/smartphoneReadSettings', function (settings) {
			for(let key in settings) {
				let x = $(`input[name=${key}]`).is(':checked');
				let y = (settings[key] == 'true');
				// console.log(`${x} (${typeof(x)}) != ${y} (${typeof(y)}) \t| output: ${x != y}`);
				// console.log(`${x} (${typeof(x)}) !== ${y} (${typeof(y)}) \t| output: ${x !== y}`);
				if (x !== y)
					$(`div[name=${key}]`).click();
			}
			$('#remoteWrapper').css('display', 'block');
		});
	}
});