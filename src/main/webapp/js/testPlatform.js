import { SSE } from "./sse.js";

//set up canvas for progress indicator
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const TestStatus = { // Status codes for setProgressTitle
	NONE: 'none',
	RUNNING: 'running',
	DONE: 'done',
	FAILED: 'failed'
}

const TestNameDesc = {
	POWER_ON	: "Turn ON and verify current draw",
	READ_SN		: "Reading module serial number",
	TEST_DIAG	: "Reading diagnostics data stream",
	TEST_OPT	: "Testing 5 digital OPTION pins",
	TEST_PGM 	: "Verifing 16 programs",
	TEST_CV 	: "Testing 6 analog control voltages",
	TEST_SR		: "Testing 4 sampling rates",
	TEST_TT 	: "Testing tap-tempo delay interval",
	TEST_AUD 	: "Testing 4 audio channels",
	TEST_MEM	: "Testing 32768 delay memory locations",
	POWER_OFF	: "Power OFF"
}

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
	if($("#negTest").hasClass("negTestEnabled")) {
		$("#negTest").toggleClass("negTestEnabled");
		$("#btnPowerOnFail").css("visibility", "hidden");
		$("#negTestIndicator").html("Negative Testing: <b>OFF</b>");
		$("#negTest").text("ON");
	}
	$.ajax({
		url: "RunTests?test=NEG_TEST_OFF",
		type: "GET",
		contentType: "text",
		success: function(result) {
			//alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnAutoTest").click(function() {
	$("#manualTest").toggleClass("hiddenTab");
	$("#autoTest").toggleClass("hiddenTab");
});

$("#btnPowerOn").click(function() {
	$("#manual-result-div").css("visibility", "visible");
	$("#manual-result-icon").css("visibility", "visible");
	$("#manual-result-msg").text("Running...");
	$.ajax({
		url: "RunTests?test=POWER_ON",
		type: "GET",
		contentType: "text",
		success: function(result) {
			if (result.startsWith("PASS")) {
				$("#manual-result-div").css("visibility", "hidden");
				$("#manual-result-icon").css("visibility", "hidden");
				$("#btnPowerOn").css("background-color", "rgb(0,196,0)");
			}
			else {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text(result);
				$("#btnPowerOn").css("background-color", "rgb(255,85,85)");
			}
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnPowerOff").click(function() {
	$("#manual-result-div").css("visibility", "visible");
	$("#manual-result-icon").css("visibility", "visible");
	$("#manual-result-msg").text("Running...");
	$.ajax({
		url: "RunTests?test=POWER_OFF",
		type: "GET",
		contentType: "text",
		success: function(result) {
			if (result.startsWith("PASS")) {
				$("#manual-result-div").css("visibility", "hidden");
				$("#manual-result-icon").css("visibility", "hidden");
				$("#btnPowerOff").css("background-color", "rgb(0,196,0)");
			}
			else {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text(result);
				$("#btnPowerOff").css("background-color", "rgb(255,85,85)");
			}
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnReadSN").click(function() {
	$("#manual-result-div").css("visibility", "visible");
	$("#manual-result-icon").css("visibility", "visible");
	$("#manual-result-msg").text("Running...");
	$.ajax({
		url: "RunTests?test=READ_SN",
		type: "GET",
		contentType: "text",
		success: function(result) {
			if (result.startsWith("PASS")) {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text("Serial Number: " + result.substring(6,16));
				$("#btnReadSN").css("background-color", "rgb(0,196,0)");
			}
			else {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text(result);
				$("#btnReadSN").css("background-color", "rgb(255,85,85)");
			}

			//alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyDiagStream").click(function() {
	$("#manual-result-div").css("visibility", "visible");
	$("#manual-result-icon").css("visibility", "visible");
	$("#manual-result-msg").text("Running...");
	$.ajax({
		url: "RunTests?test=TEST_DIAG",
		type: "GET",
		contentType: "text",
		success: function(result) {
			if (result.startsWith("PASS")) {
				$("#manual-result-div").css("visibility", "hidden");
				$("#manual-result-icon").css("visibility", "hidden");
				$("#btnVerifyDiagStream").css("background-color", "rgb(0,196,0)");
			}
			else {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text(result);
				$("#btnVerifyDiagStream").css("background-color", "rgb(255,85,85)");
			}
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyCVInputs").click(function() {
	$("#manual-result-div").css("visibility", "visible");
	$("#manual-result-icon").css("visibility", "visible");
	$("#manual-result-msg").text("Running...");
	$.ajax({
		url: "RunTests?test=TEST_CV",
		type: "GET",
		contentType: "text",
		success: function(result) {
			if (result.startsWith("PASS")) {
				$("#manual-result-div").css("visibility", "hidden");
				$("#manual-result-icon").css("visibility", "hidden");
				$("#btnVerifyCVInputs").css("background-color", "rgb(0,196,0)");
			}
			else {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text(result);
				$("#btnVerifyCVInputs").css("background-color", "rgb(255,85,85)");
			}
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyOpt").click(function() {
	$("#manual-result-div").css("visibility", "visible");
	$("#manual-result-icon").css("visibility", "visible");
	$("#manual-result-msg").text("Running...");
	$.ajax({
		url: "RunTests?test=TEST_OPT",
		type: "GET",
		contentType: "text",
		success: function(result) {
			if (result.startsWith("PASS")) {
				$("#manual-result-div").css("visibility", "hidden");
				$("#manual-result-icon").css("visibility", "hidden");
				$("#btnVerifyOpt").css("background-color", "rgb(0,196,0)");
			}
			else {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text(result);
				$("#btnVerifyOpt").css("background-color", "rgb(255,85,85)");
			}
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyPGM").click(function() {
	$("#manual-result-div").css("visibility", "visible");
	$("#manual-result-icon").css("visibility", "visible");
	$("#manual-result-msg").text("Running...");
	$.ajax({
		url: "RunTests?test=TEST_PGM",
		type: "GET",
		contentType: "text",
		success: function(result) {
			if (result.startsWith("PASS")) {
				$("#manual-result-div").css("visibility", "hidden");
				$("#manual-result-icon").css("visibility", "hidden");
				$("#btnVerifyPGM").css("background-color", "rgb(0,196,0)");
			}
			else {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text(result);
				$("#btnVerifyPGM").css("background-color", "rgb(255,85,85)");
			}
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifySamplingRates").click(function() {
	$("#manual-result-div").css("visibility", "visible");
	$("#manual-result-icon").css("visibility", "visible");
	$("#manual-result-msg").text("Running...");
	$.ajax({
		url: "RunTests?test=TEST_SR",
		type: "GET",
		contentType: "text",
		success: function(result) {
			if (result.startsWith("PASS")) {
				$("#manual-result-div").css("visibility", "hidden");
				$("#manual-result-icon").css("visibility", "hidden");
				$("#btnVerifySamplingRates").css("background-color", "rgb(0,196,0)");
			}
			else {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text(result);
				$("#btnVerifySamplingRates").css("background-color", "rgb(255,85,85)");
			}
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyTapTempo").click(function() {
	$("#manual-result-div").css("visibility", "visible");
	$("#manual-result-icon").css("visibility", "visible");
	$("#manual-result-msg").text("Running...");
	$.ajax({
		url: "RunTests?test=TEST_TT",
		type: "GET",
		contentType: "text",
		success: function(result) {
			if (result.startsWith("PASS")) {
				$("#manual-result-div").css("visibility", "hidden");
				$("#manual-result-icon").css("visibility", "hidden");
				$("#btnVerifyTapTempo").css("background-color", "rgb(0,196,0)");
			}
			else {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text(result);
				$("#btnVerifyTapTempo").css("background-color", "rgb(255,85,85)");
			}
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyAudioPassthrough").click(function() {
	$("#manual-result-div").css("visibility", "visible");
	$("#manual-result-icon").css("visibility", "visible");
	$("#manual-result-msg").text("Running...");
	$.ajax({
		url: "RunTests?test=TEST_AUD",
		type: "GET",
		contentType: "text",
		success: function(result) {
			if (result.startsWith("PASS")) {
				$("#manual-result-div").css("visibility", "hidden");
				$("#manual-result-icon").css("visibility", "hidden");
				$("#btnVerifyAudioPassthrough").css("background-color", "rgb(0,196,0)");
			}
			else {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text(result);
				$("#btnVerifyAudioPassthrough").css("background-color", "rgb(255,85,85)");
			}
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnVerifyDelayMemory").click(function() {
	$("#manual-result-div").css("visibility", "visible");
	$("#manual-result-icon").css("visibility", "visible");
	$("#manual-result-msg").text("Running...");
	$.ajax({
		url: "RunTests?test=TEST_MEM",
		type: "GET",
		contentType: "text",
		success: function(result) {
			if (result.startsWith("PASS")) {
				$("#manual-result-div").css("visibility", "hidden");
				$("#manual-result-icon").css("visibility", "hidden");
				$("#btnVerifyDelayMemory").css("background-color", "rgb(0,196,0)");
			}
			else {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text(result);
				$("#btnVerifyDelayMemory").css("background-color", "rgb(255,85,85)");
			}
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#btnPowerOnFail").click(function() {
	$("#manual-result-div").css("visibility", "visible");
	$("#manual-result-icon").css("visibility", "visible");
	$("#manual-result-msg").text("Running...");
	$.ajax({
		url: "RunTests?test=POWER_ON_NEG",
		type: "GET",
		contentType: "text",
		success: function(result) {
			if (result.startsWith("PASS")) {
				$("#manual-result-div").css("visibility", "hidden");
				$("#manual-result-icon").css("visibility", "hidden");
				$("#btnPowerOnFail").css("background-color", "rgb(0,196,0)");
			}
			else {
				$("#manual-result-icon").css("visibility", "hidden");
				$("#manual-result-msg").text(result);
				$("#btnPowerOnFail").css("background-color", "rgb(255,85,85)");
			}
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

$("#negTest").click(function() {
	var testStr;
	$("#negTest").toggleClass("negTestEnabled")
	if($("#negTest").hasClass("negTestEnabled")) {
		testStr = "NEG_TEST_ON";
		//$("#btnPowerOnFail").css("display", "inline-block");
		$("#btnPowerOnFail").css("visibility", "visible");
		$("#negTestIndicator").html("Negative Testing: <b>ON</b>");
		$("#negTest").text("OFF");
	}
	else {
		testStr = "NEG_TEST_OFF";
		$("#btnPowerOnFail").css("visibility", "hidden");
		$("#negTestIndicator").html("Negative Testing: <b>OFF</b>");
		$("#negTest").text("ON");
	}
	$.ajax({
		url: "RunTests?test=" + testStr,
		type: "GET",
		contentType: "text",
		success: function(result) {
			//alert(result);
		},
		error: function(xhr) {
			alert("Error: HTTP status " + xhr.status);
		}
	});
});

//define click function for Start button
$("#btnStart").click(async function() {
	
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
	
	runAutoTests();

});

/**
 * This will perform an (async) power-on of the module. If a callback function is
 * supplied it will be called when the process is complete with a single string
 * result that will start with "PASS" if the power-on was sucessful, otherwise
 * it will be an error message.
 * 
 * Note this is async and this function returns before the power-on has been done.
 */
async function powerOn(optionalCallback) {
	$.ajax({
		url: "RunTests?test=POWER_ON",
		type: "GET",
		contentType: "text",
		success: function(result) {
			// Pass back the test result as-is
			if (optionalCallback) optionalCallback(result);
		},
		error: function(xhr) {
			// HTTP error
			if (optionalCallback) optionalCallback("FAIL: Module failed to power on. "+util.getServerErrorTxt(xhr));
		}
	});
	
}

/**
 * Obtains the module serial number and returns to the callback a string that
 * is "0X..." or "Some failure message". The UI field #moduleSN is
 * updated during this process.
 * 
 * Note this is an async function that returns before the operation is complete.
 * 
 * The callback is optional.
 */
async function getModuleSN(callback) {
	$("#moduleSN").text("Reading...");
	$.ajax({
		url: "RunTests?test=READ_SN",
		type: "GET",
		contentType: "text",
		success: function(result) {
			// Expected result is "PASS: 0X12345678 ..."
			let sn = "Unavailable";
			if (result.startsWith("PASS:")) {
				sn = result.substring(6,6+10);
			}
			$("#moduleSN").text(sn);
			if (callback) callback(result);
		},
		error: function(xhr) {
			log("HTTP error getting SN: "+util.getServerErrorText(xhr));
			$("#moduleSN").text("Unavailable");
			if (callback) callback("FAIL: "+util.getServerErrorText(xhr));
		}
	});
	
}

/**
 * This will perform an (async) power-off of the module. If a callback function is
 * supplied it will be called when the process is complete with a single string
 * result that will start with "PASS" if the power-off was sucessful, otherwise
 * it will be an error message.
 * 
 * Note this is async and this function returns before the power-off has been done.
 */
async function powerOff(optionalCallback) {
	$.ajax({
		url: "RunTests?test=POWER_OFF",
		type: "GET",
		contentType: "application/json",
		success: function(result) {
			if (optionalCallback) optionalCallback(result.cmd);
		},
		error: function(xhr) {
			// HTTP error
			if (optionalCallback) optionalCallback("FAILED: Module failed to power off. "+util.getServerErrorTxt(xhr));
		}
	});
	
}

/**
 * Sets the test results are status message along with an icon
 * (or other visual indicator) of the status. 
 * 
 * status: One of the TestStatus codes
 */
function setProgressTitle(msg, status) {
	// Set icon based on status
	let ext = ".gif";
	if (status == TestStatus.RUNNING) ext = ".apng";
	$("#progressIcon").attr("src", "images/progress-"+status+ext);
	$("#progressTitle").text(msg);
}

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
	
	log("Starting module firmware update");
	
	// Setup async listener for messages from the server
	sse.addEventListener("message", (e) => {
	  //log(e.data);
	  let status = JSON.parse(e.data);
		if (status.status == "running") {
			let pctDone = Math.ceil((status.currStep / status.maxStep) * 100.0);
			$(uiPrefix+"bar").css("width", pctDone+"%");
			$(uiPrefix+"status").text(status.msg);
			log("Module update: "+status.msg);

		}
		else if (status.status == "failed") {
			//util.alertBox("Update Failed", status.msg);
			$(uiPrefix+"bar").css("width", "0%");
			$(uiPrefix+"progress").hide();
			$(uiPrefix+"status").text("UPDATE FAILED: "+status.msg);
			updateFinished = true;
			log("Module update failed: "+status.msg);
		}
		else if (status.status == "diag") {
			diagnostics = status.msg; // Save diagnostics (stdErr of update process)
			log(diagnostics);
			//util.alertBox("Diagnostic Message", diagnostics);
		}
		else if (status.status == "ok") {
			$(uiPrefix+"status").text("Update completed with no errors");
			$(uiPrefix+"bar").css("width", "0%");
			$(uiPrefix+"progress").hide();
			updateFinished = true;
			successful = true;
			log("Module update completed successfully");
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
		//log("SEE readystatechanged called");
		if (e.readyState == 2) {
			//log("SSE CLOSED");
			//log("updateFinished = "+updateFinished);
			//log("sucessful = "+sucessful);
			if (!updateFinished) {
				// The connection was closed before a final status 'failed' or 'ok' message was
				// issued. This should not happen, and we have no information about what the problem was.
				util.msgBox("Error","The update process failed to complete for unknown reasons.");
			}
			if (callbackWhenDone) callbackWhenDone(successful ? "PASS" : "FAIL");
			
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
	runAutoTests(true);
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

$("#btnClearResults").click(function() {
	$(".manualTestBtn").css("background-color", "rgb(160,160,160)");
});

/**
 * Starting point of running a test sequence. Returns before the sequence is complete. UI
 * is kept up to date including final test status (there is no async callback).
 */
async function runAutoTests() {
	clearLog();

	// Prepare initial UI state
	$("#moduleSN").text("Unknown");
	$("#update-div").hide();

	log("Auto test started");
	
	
	// Power on is always the first step
	setProgressTitle("Module powering on, please wait...", TestStatus.RUNNING);
	powerOn(function(powerResult) {
		log("Power on result: "+powerResult);

		if (powerResult.startsWith("PASS")) {
			
			// Continue with next step
			runAutoTest2(function(auto2Result) {
				if (auto2Result.startsWith("PASS")) {
					setProgressTitle("All testing passed", TestStatus.DONE);
				}
				else {
					// If testing did not complete, module was probably left
					// on the power ON state, try to turn it off.
					setProgressTitle("Module powering off, please wait...", TestStatus.RUNNING);
					powerOff(function() {
						// No matter if power off failed or not, set final message to test failure
						setProgressTitle(auto2Result, TestStatus.FAILED);
					});
				}
			});
		}
		else {
			// Power on failed
			setProgressTitle(powerResult, TestStatus.FAILED);
		}
	});
}


async function runAutoTest2(callback) {
			
	// Get the module SN, but don't stop the testing if it fails. Subsequent steps
	// may (based on options) require it and will fail at that point. The SN can
	// be retrieved after this step from $("#moduleSN").text(). Validate is starts
	// with "0X" before using it.
		
	setProgressTitle("Getting module serial number, please wait...", TestStatus.RUNNING);
	getModuleSN(function(snResult) {
		log("Read module SN result: "+snResult);

		// No matter if this step failed or not, continue
		runAutoTest3(function(run3Result) {
			// Return result of the rest of the tests
			callback(run3Result);
		});
	});
}

async function runAutoTest3(callback) {
	
	// Do module registration if requested
	
	if ($("#cbInitNewMod").is(':checked')) {
		setProgressTitle("Registering module in CTG database, please wait...", TestStatus.RUNNING);
		registerModule(function(regResult) {
			log("Module registration result: "+regResult);
			if (regResult.startsWith("PASS")) {
				runAutoTest4(function(run4Result) {
					callback(run4Result);
				}); 
			}
			else {
				// Registration failed, pass fail back to caller's handler
				callback(regResult);
			}
		});
	}
	else {
		// Skip registration, just continue with the next step
		log("Registration skipped");
		runAutoTest4(function(run4Result) {
			callback(run4Result);
		}); 
	}
}

async function runAutoTest4(callback) {
	
	// Load module firmware if requested
		
	if ($("#cbLoadFirmware").is(':checked')) {
		setProgressTitle("Loading module firmware, please wait...", TestStatus.RUNNING);
		
		// Now run the (async) firmware update, if that runs OK, continue to next step
		$("#update-div").show(); // Make update UI visible
		updateModuleFirmware("#update-", async function(firmwareResult) {
			log("Firmware load result: "+firmwareResult);

			// If the firmware load completed OK, contine
			if (firmwareResult.startsWith("PASS")) {
				$("#update-div").hide();
				runAutoTest5(function(run5Result) {
					callback(run5Result);
				});
			} else {
				// Update failed, pass it back to caller's handler
				// Note we leave the UI visible 
				callback(firmwareResult);
			}
		});
	}
	else {
		// Run next step without loading any firmware
		log("Firmware load skipped");

		runAutoTest5(function(run5Result) {
			callback(run5Result);
		});
	}
}

async function runAutoTest5(callback) {
	
	setProgressTitle("Testing module hardware, please wait...", TestStatus.RUNNING);
	runHardwareTests(function(autoResult) {
		log("Hardware test result: "+autoResult);
		if (autoResult.startsWith("PASS")) {
			log("Auto testing completed '"+autoResult+"'");
			// Hardware tests passed, continue with next stp
			runAutoTest6(function(run6Result) {
				callback(run6Result);
			});
		}
		else {
			// Hardware tests failed, send results back
			callback(autoResult);
		}
	});
}

async function runAutoTest6(callback) {
	
	// Update stock level only if requested
	
	if ($("#cbAddToStock").is(':checked')) {
		setProgressTitle("Adding to stock, please wait...", TestStatus.RUNNING);
		addModuleToStock(function(addResult) {
			log("Add to stock result: "+addResult);
			callback(addResult);
		});
	}
	else {
		// No more steps to run
		log("Add to stock skipped");
		callback("PASS:");
	}
}

/**
 * Calls the local server as a proxy to the production CGG web server's
 * protected API that registers a new module.
 */
async function registerModule(callbackWhenDone) {
	
	let sn = $("#moduleSN").text();
	if (!sn || !sn.startsWith("0X")) {
		callbackWhenDone("No serail number available, cannot register module");
		return;
	}
	
	$.ajax({
		url: "UpdateRegistration?option=new&sn="+encodeURIComponent(sn),
		type: "GET",
		contentType: "text",
		success: function(regResult) {
			callbackWhenDone(regResult);
		},
		error: function(xhr) {
			callbackWhenDone("Registration failed, "+util.getServerErrorText(xhr));
		}
	});
	
}

/**
 * Call our local server as a proxy to the CTG production system to call the
 * protected API that modifies a SKU (product) stock count.
 */
async function addModuleToStock(callbackWhenDone) {
	$.ajax({
		url: "UpdateStock",
		type: "GET",
		contentType: "text",
		success: function() {
			// Returns no content, just HTTP 200
			callbackWhenDone("PASS");
		},
		error: function(xhr) {
			callbackWhenDone("Stock update failed, "+util.getServerErrorTxt(xhr));
		}
	});
}

async function runHardwareTests(callbackWhenDone) {
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

	let sse = new SSE("RunTests?test=SEQUENCE&retest=false", { autoReconnect: false }); // Invoke the servlet with no auto-retry

	// Setup async listener for messages from the server
	sse.addEventListener("message", (e) => {
		log("Async message from server:" + JSON.stringify(e));

		let status = JSON.parse(e.data);
		//alert(JSON.stringify(status));
		if (status.cmd) log("Cmd = '"+status.cmd+"'");
			else log("No DATA.CMD field in the status event.");
			
		updateFinished = status.cmd.startsWith("FAIL") || status.cmd.startsWith("PASS");
		successful = status.cmd.startsWith("PASS");
		lastCmd = status.cmd;
		if (!updateFinished) {
			let msg = TestNameDesc[status.testName];
			if (msg==null) msg = status.testName; // Just in case we don't know this test
			$("#msg").text(msg);

			let prevProgress = status.startProg;
			//alert(prevProgress);
			let estProgress = status.endProg;
			let estTime = status.expectedTime;
			drawProgress(prevProgress, estProgress, estTime);
		}
	});
	
	// Listen for state changes (and CLOSE in particular). We will get this event when
	// the server closes the connection (e.g. 'commits' the response), or some error (e.g. network)
	// causes the connection to be closed.
	sse.addEventListener("readystatechange", (e) => {
		log("SEE readystatechanged called, state="+e.readyState);
		if (e.readyState == 2) {
			log("SSE CLOSED");
			log("updateFinished = " + updateFinished);
			log("sucessful = " + successful);
			if (!updateFinished) {
				// The connection was closed before a final status 'failed' or 'ok' message was
				// issued. This should not happen, and we have no information about what the problem was.
				callbackWhenDone("FAIL: Testing unexpectedy terminated")
			}
			if (lastCmd === "FAIL: Module already exists in DB") {
				$("#btnCancel").css("display", "none");
				$("#btnConfirmRetest").css("display", "inline-block");
			}
			$("#msg").text(""); // Clear old progress messages
			callbackWhenDone(lastCmd);
		}
	});
}

$("#show-log").click(function() {
	util.dlgBox2("Log", "#log-dlg", 
		function() {}, 
		function() {},
		{
			"OK" : function() {
				$(this).data("action", "ok"); // Note OK button was used
				$(this).dialog("close");
			}
		}
	 );
	 
});

function clearLog() {
	$("#log-dlg-textarea").val('');
}
function log(msg) {
	$("#log-dlg-textarea").val($("#log-dlg-textarea").val()+'\n'+msg);
	console.log(msg);
}

/**
 * On page load
 */
$(function() {
	$("#log-dlg").dialog({
		width:'50vw',
		modal: true,
		autoOpen: false
	});	
});