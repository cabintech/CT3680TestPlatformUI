import { SSE } from "./sse.js";

//set up canvas for progress indicator
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

//draw the outline
function drawCircle() {
	//clear the canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var radius = 51;
	var startAngle = 0;
	var endAngle = Math.PI * 2;
	ctx.beginPath();
	ctx.lineCap = "square";
	ctx.strokeStyle = "black";
	ctx.arc(centerX, centerY, radius, startAngle, endAngle, true);
	ctx.stroke();
}

//wait for a specified time in miliseconds
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

//fill the circle to indicate progress status
//will be updated to take an argument indicating percent complete
//currently hardcoded to update every 50 ms until reaching 100% progress after 5 seconds
async function drawProgress(prevProgress, estProgress, estTime) { 
	//debugger;
	var radius = 50;
	var startAngle = 0 - (Math.PI / 2);
	ctx.beginPath();
	ctx.lineCap = "square";
	ctx.strokeStyle = "black";

	//calculate delay time
	var waitTime = Math.floor(estTime / (estProgress - prevProgress) * 1000);

	//start filling the remainder of the circle until reaching the stopping point, updating 10x/sec
	var endAngle = (Math.PI * 2) * ((prevProgress + 1) / 100) - (Math.PI / 2);
	var finalEndAngle = (Math.PI * 2) * (estProgress / 100) - (Math.PI / 2);
	var currProgress = prevProgress + 1;
	while (endAngle <= finalEndAngle) {
		//draw and fill the arc
		ctx.moveTo(centerX, centerY);
		ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
		ctx.closePath();
		ctx.fillStyle = 'blue';
		ctx.fill();

		//update the label to display % complete
		$("#progress").text(currProgress + "%");

		//update endAngle
		endAngle = (Math.PI * 2) * ((currProgress + 1) / 100) - (Math.PI / 2);
		currProgress++;

		//wait 50 ms
		await sleep(waitTime);
	}
}

$("#btnManualTest").click(function() {
	$("#manualTest").toggleClass("hiddenTab");
	$("#autoTest").toggleClass("hiddenTab");
});

$("#btnAutoTest").click(function() {
	$("#manualTest").toggleClass("hiddenTab");
	$("#autoTest").toggleClass("hiddenTab");
});

$("#btnPowerOn").click(function() {
	$.ajax({
		url: "RunTests?test=POWER_ON",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnPowerOff").click(function() {
	$.ajax({
		url: "RunTests?test=POWER_OFF",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnReadSN").click(function() {
	$.ajax({
		url: "RunTests?test=READ_SN",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyDiagStream").click(function() {
	$.ajax({
		url: "RunTests?test=TEST_DIAG",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyCVInputs").click(function() {
	$.ajax({
		url: "RunTests?test=TEST_CV",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyOpt").click(function() {
	$.ajax({
		url: "RunTests?test=TEST_OPT",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyPGM").click(function() {
	$.ajax({
		url: "RunTests?test=TEST_PGM",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifySamplingRates").click(function() {
	$.ajax({
		url: "RunTests?test=TEST_SR",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyTapTempo").click(function() {
	$.ajax({
		url: "RunTests?test=TEST_TT",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyAudioPassthrough").click(function() {
	$.ajax({
		url: "RunTests?test=TEST_AUD",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyDelayMemory").click(function() {
	$.ajax({
		url: "RunTests?test=TEST_MEM",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

//define click function for Start button
$("#btnStart").click(async function() {
	$("#progressTitle").text("Testing in progress, please wait....");
	
	if ($("#progressPage").hasClass("hiddenTab")) {
		$("#progressPage").toggleClass("hiddenTab");
		$("#waitForStart").toggleClass("hiddenTab");
	}
	
	//draw the outline for the progress indicator
	drawCircle();
	//fill in the progress indicator (currently hardcoded)
	//await drawProgress(0,25,4);
	//await drawProgress(25,50,8);
	//await drawProgress(50,75,2);
	//await drawProgress(75,100,5);
	
	// If the module firmware needs to be loaded, do that before starting the tests.
	if ($("#cbLoadFirmware").is(':checked')) {
		updateModuleFirmware("#update-", async function(success) {
			// If the firmware load completed OK, start the tests
			if (success) {
				updateProgress(false);
			}
		})
	}
	else {
		// Run the tests without loading any firmware
		updateProgress(false);
	}

	//make a call to TestCom servlet
	//		$.ajax({
	//			url: "TestCom",
	//			type: "GET",
	//			contentType: "text",
	//			success: function(result) {
	//				//no need to do anything, this is just to test communication between the PC and uC, will be replaced later
	//			},
	//			error: function(xhr) {
	//				alert("Error: HTTP status " + xhr.status);
	//			}
	//		});
	//		$.ajax({
	//			url: "RunTests?test=SEQUENCE",
	//			type: "GET",
	//			contentType: "text",
	//			success: function(result) {
	//				alert(result);
	//			},
	//			error: function(xhr) {
	//				alert("Error: HTTP status " + xhr.status);
	//			}
	//		});
});


/**
 * Runs the firmware update on the attached module updating a series of UI controls with
 * status and messages as it runs. When done the callback function (if supplied) will be
 * invoked with a single boolean = true if the update was successful.
 * 
 * uiPrefix: jQuery selector prefix for UI elements to be updated with progress
 * callbackWhenDone: function to be invoked with a single boolean value 
 * fwVersion: Firmware version to be loaded, defaults to latest production version
 * 
 * Last 2 args are optional.
 */
async function updateModuleFirmware(uiPrefix, callbackWhenDone, fwVersion) {
	
	if (!fwVersion) fwVersion = "";

	$(uiPrefix+"status").text("");
	$(uiPrefix+"bar").css("width", "0%");
	$(uiPrefix+"progress").show();
	//$("#start-update-btn").button("option","disabled",true); // Disable manual update until this one is done
	
	let updateFinished = false; // Failed or ok, confirmed that the process is done
	let successful = false;
	let diagnostics = ""; // Server supplied stdErr of update process
	//let server = $("#server").val();
	
	// We use the SSE (Server Sent Events) JS library here to invoke a servlet on the server and then read
	// a stream of events from it. (The built-in EventSource is quite limited and it's retry feature cannot
	// be reliably disabled, which is bad as we never want to invoke the servlet multiple times).
	//
	// Upon construction, the SSE makes a GET request to the server. It will then deliver event stream
	// messages to the event listener. It will also send events to the readystatechange listener, in particular
	// when the server closes the connection. Note that although this is HTTP protocol, there is no use of HTTP
	// status codes here because the HTTP status (200) is sent as soon as the stream is opened, it is not possible
	// to send some other status later in the stream. So we must handle all errors within the context of the
	// stream data, not the HTTP protocol.
	//
	// It would be interesting to reimplement this with WebSockets for (maybe) a simplier approach.
	
	let sse = new SSE("UpdateModule", {autoReconnect: false}); // Invoke the servlet with no auto-retry
	
	// Setup async listener for messages from the server
	sse.addEventListener("message", (e) => {
	  //console.log(e.data);
	  let status = JSON.parse(e.data);
		if (status.status == "running") {
			let pctDone = Math.ceil((status.currStep / status.maxStep) * 100.0);
			$(uiPrefix+"bar").css("width", pctDone+"%");
			$(uiPrefix+"status").text(status.msg);
		}
		else if (status.status == "failed") {
			//util.alertBox("Update Failed", status.msg);
			$(uiPrefix+"bar").css("width", "0%");
			$(uiPrefix+"progress").hide();
			$(uiPrefix+"status").text("UPDATE FAILED: "+status.msg);
			updateFinished = true;
		}
		else if (status.status == "diag") {
			diagnostics = status.msg; // Save diagnostics (stdErr of update process)
			console.log(diagnostics);
			//util.alertBox("Diagnostic Message", diagnostics);
		}
		else if (status.status == "ok") {
			$(uiPrefix+"status").text("Update completed with no errors");
			$(uiPrefix+"bar").css("width", "0%");
			$(uiPrefix+"progress").hide();
			updateFinished = true;
			successful = true;
		}
		else {
			// Unrecognized status, should never happen
			$(uiPrefix+"status").text(status.status+":"+status.msg);
		}
	});
	
	// Listen for state changes (and CLOSE in particular). We will get this event when
	// the server closes the connection (e.g. 'commits' the response), or some error (e.g. network)
	// causes the connection to be closed.
	sse.addEventListener("readystatechange", (e) => {
		//console.log("SEE readystatechanged called");
		if (e.readyState == 2) {
			//console.log("SSE CLOSED");
			//console.log("updateFinished = "+updateFinished);
			//console.log("sucessful = "+sucessful);
			if (!updateFinished) {
				// The connection was closed before a final status 'failed' or 'ok' message was
				// issued. This should not happen, and we have no information about what the problem was.
				util.msgBox("Error","The update process failed to complete for unknown reasons.");
			}
			if (callbackWhenDone) callbackWhenDone(successful);
		}
	});

}


$("#testDB").click(function() {
	$.ajax({
		url: "UpdateStock",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#testReg").click(function() {
	$.ajax({
		url: "UpdateRegistration?sn=0X0000AFB2&option=new",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnConfirmRetest").click(function() {
	$("#btnConfirmRetest").css("display", "none");
	$("#btnCancel").css("display", "inline-block");
	
	drawCircle();
	updateProgress(true);
});

$("#btnCancel").click(function() {
	$.ajax({
		url: "RunTests?test=POWER_OFF",
		type: "GET",
		contentType: "text",
		success: function(result) {
			alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

async function updateProgress(retest) {
	let updateFinished = false; // Failed or Passed, confirmed that the process is done
	let successful = false;
	let lastCmd = "FAIL no status messages received from server";

	// We use the SSE (Server Sent Events) JS library here to invoke a servlet on the server and then read
	// a stream of events from it. (The built-in EventSource is quite limited and it's retry feature cannot
	// be reliably disabled, which is bad as we never want to invoke the servlet multiple times).

	// Upon construction, the SSE makes a GET request to the server. It will then deliver event stream
	// messages to the event listener. It will also send events to the readystatechange listener, in particular
	// when the server closes the connection. Note that although this is HTTP protocol, there is no use of HTTP
	// status codes here because the HTTP status (200) is sent as soon as the stream is opened, it is not possible
	// to send some other status later in the stream. So we must handle all errors within the context of the
	// stream data, not the HTTP protocol.

	let sse = new SSE("RunTests?test=SEQUENCE?retest=" + retest, { autoReconnect: false }); // Invoke the servlet with no auto-retry

	// Setup async listener for messages from the server
	sse.addEventListener("message", (e) => {
		console.log("Async message from server:" + JSON.stringify(e));

		let status = JSON.parse(e.data);
		//alert(JSON.stringify(status));
		if (status.cmd) console.log("Cmd = '"+status.cmd+"'");
			else console.log("No DATA.CMD field in the status event.");
			
		updateFinished = status.cmd.startsWith("FAIL") || status.cmd.startsWith("PASSED");
		successful = status.cmd.startsWith("PASSED");
		lastCmd = status.cmd;
		$("#msg").text("Running test: " + status.testName);

		let prevProgress = status.startProg;
		//alert(prevProgress);
		let estProgress = status.endProg;
		let estTime = status.expectedTime;
		drawProgress(prevProgress, estProgress, estTime);
	});
	
	// Listen for state changes (and CLOSE in particular). We will get this event when
	// the server closes the connection (e.g. 'commits' the response), or some error (e.g. network)
	// causes the connection to be closed.
	sse.addEventListener("readystatechange", (e) => {
		console.log("SEE readystatechanged called, state="+e.readyState);
		if (e.readyState == 2) {
			console.log("SSE CLOSED");
			console.log("updateFinished = " + updateFinished);
			console.log("sucessful = " + successful);
			if (!updateFinished) {
				// The connection was closed before a final status 'failed' or 'ok' message was
				// issued. This should not happen, and we have no information about what the problem was.
				$("#progressTitle").text("Testing terminated....");
				$("#msg").text("Error: The update process failed to complete for unknown reasons.");

			}
			else if (!successful) {
				$("#progressTitle").text("Testing terminated....");
				$("#msg").text(lastCmd);
				
				if(lastCmd === "FAIL: Module already exists in DB") {
					$("#btnCancel").css("display", "none");
					$("#btnConfirmRetest").css("display", "inline-block");
				}
			}
			else {
				$("#progressTitle").text("Testing Complete!");
				if ($("#cbAddToStock").is(':checked')) {
					$.ajax({
						url: "UpdateStock",
						type: "GET",
						contentType: "text",
						success: function(result) {
							alert(result);
						},
						error: function(xhr) {
							alert("Error: HTTP status " + xhr.status);
						}
					});
				}
				if ($("#cbInitNewModule").is(':checked')) {
					$.ajax({
						//add sn and option params
						url: "UpdateRegistration",
						type: "GET",
						contentType: "text",
						success: function(result) {
							alert(result);
						},
						error: function(xhr) {
							alert("Error: HTTP status " + xhr.status);
						}
					});
				}
			}
		}
	});
}