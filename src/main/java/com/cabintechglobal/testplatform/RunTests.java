package com.cabintechglobal.testplatform;

import java.io.IOException;
import java.io.PrintWriter;

import com.fazecast.jSerialComm.SerialPort;

import jakarta.servlet.AsyncContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kong.unirest.HttpResponse;
import kong.unirest.Unirest;

// This is a SSE (Server Sent Events) endpoint. It will send status message back the client as the module update
// progresses using the Content-Type ""text/event-stream". The response is not completed until the update is done or it
// fails.
// 
// The browser Javascript client uses an EventSource object to invoke this servlet and listen for events this servlet produces. 
// 
// References for the design of this servlet:
// 
// Async servlets: https://docs.oracle.com/javaee/7/tutorial/servlets012.htm
// Server Sent Events: 
//   (Java server): https://medium.com/codimis/what-is-server-sent-event-sse-and-how-to-use-it-in-java-spring-boot-7f4ffa828882
//   (client side): https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events 

/**
 * Servlet implementation class RunTests
 */
@WebServlet(urlPatterns = "/RunTests", asyncSupported = true)
public class RunTests extends HttpServlet implements Constants {
	private static final long serialVersionUID = 1L;

	/**
	 * @see HttpServlet#HttpServlet()
	 */
	public RunTests() {
		super();
		// TODO Auto-generated constructor stub
	}

	/**
	 * Endpoint called by client code to run one or more hardware tests. The initial
	 * (synchronous) call only sets up an async stream which is used by an async
	 * thread triggered by the server after this method returns. Unlike normal
	 * servlets, the HTTP response is not 'committed' (e.g. completed) when this
	 * call returns, completion of the HTTP response is done by the async thread
	 * later - the connection to the client stays open until that async thread
	 * explicitly closes it with AsyncContext.complete().
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {

		// Get URL parameters
		String test = request.getParameter("test");
		String retest = request.getParameter("retest");

		// Configure an async response stream
		AsyncContext async = request.startAsync();
		async.setTimeout(60 * 2 * 1000); // Timeout this operation if it does not complete in 2 minutes

		// Tell Tomcat to run this lambda function on an async thread after
		// this method returns.
		async.start(() -> {
			asyncRunner(async, response, test, retest);
		});

		// Upon return from this doGet() the server will send an HTTP status 200 even
		// before
		// the async thread runs. There is no way to send any other HTTP status code in
		// this type
		// of async servlet, so any errors must be reported via the async stream.

	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		doGet(request, response);
	}

	/**
	 * This method is called by the server on a async thread after the doGet()
	 * method returns. This method can send multiple async messages to the client
	 * that originally called doGet() via the HTTP response object. The only means
	 * to communicate with the client is via the event stream, no HTTP status codes
	 * can be sent (code 200 (OK) was sent when the doGet() method completed before
	 * this routine is invoked). So any errors must be handled by sending event
	 * messages (not returning HTTP status codes).
	 * 
	 * This method must call complete() on the supplied AsyncContext before
	 * returning or the client may wait indefinitely for the stream to complete.
	 * 
	 * @param response
	 * @param test
	 * @param reTest
	 */
	private static void asyncRunner(AsyncContext async, HttpServletResponse response, String test, String reTest) {

		response.setContentType("text/event-stream");
		response.setHeader("Cache-Control", "no-cache");
		response.setCharacterEncoding("UTF-8");

		PrintWriter writer = null;

		try {
			writer = response.getWriter();

			String[] sequence = { "POWER_ON", "READ_SN", "TEST_DIAG", "TEST_OPT", "TEST_PGM", "TEST_CV", "TEST_SR",
					"TEST_TT", "TEST_AUD", "TEST_MEM", "POWER_OFF" };
			double[] progress = { 1.6, 1.0, 1.4, 4.7, 8.2, 14.2, 7.1, 3.9, 1.1, 1.0, 1.4 };
			double estTotalTime = 0;
			for (int i = 0; i < progress.length; i++) {
				estTotalTime += progress[i];
			}

			if (Util.isEmpty(test)) {
				Util.sendEventStreamMsg(writer, "cmd", "FAIL missing test name parameter");
				return;
			}

			SerialPort serialPort = SerialPort.getCommPort(PORT_DESCRIPTOR);
			serialPort.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 0, 0);

			if (!serialPort.openPort()) {
				System.out.println("Failed to open serial port " + PORT_DESCRIPTOR);
				Util.sendEventStreamMsg(writer, "cmd", "FAIL: Could not open serial port " + PORT_DESCRIPTOR);
				return;
			}

			// Configure port parameters (baud rate, data bits, stop bits, parity)
			serialPort.setBaudRate(9600);
			System.out.println("Serial port " + PORT_DESCRIPTOR + " opened successfully.");

			try { // serial port operations

				double currentProgress = 0.0;
				if (test.equals("SEQUENCE")) {
					for (int i = 0; i < sequence.length; i++) {
						String currTest = sequence[i];
						//System.out.println(currTest);
						int startingProgress = (int) Math.floor(currentProgress / estTotalTime * 100);
						int endingProgress = ((int) Math.floor((currentProgress + progress[i]) / estTotalTime * 100));
						currentProgress += progress[i];

						Util.sendEventStreamMsg(writer, "cmd", "STARTING", "startProg", startingProgress, "endProg", endingProgress,
								"expectedTime", progress[i], "testName", currTest);

						String result = performTest(serialPort, currTest);
						if (result.startsWith("FAIL")) {
							Util.sendEventStreamMsg(writer, "cmd", result);
							return;
						}
						if (currTest.equals("READ_SN")) {
							// check DB for serial number
							String parms = "?sn=" + result.substring(4).trim();
							HttpResponse<String> serverResponse = Unirest.
									get(CTG_URL+"CT3680GetSNMeta"+parms).
									asString();
							
							// if serial number in DB
							if (serverResponse.getStatus() == 404) {
								if (!reTest.equals("true")) {
									Util.sendEventStreamMsg(writer, "cmd", "FAIL: Module already exists in DB");
									return;
								}
							}
						}
					}
				} else {
					// Single test
					String result = performTest(serialPort, test);
					if (result.startsWith("FAIL")) {
						Util.sendEventStreamMsg(writer, "cmd", result);
						return;
					}

				}
			} // try serial port operations
			finally {
				// Always close the serial port even if errors or exceptions
				if (serialPort != null)
					try {
						serialPort.closePort();
						System.out.println("Serial port closed.");
					} catch (Exception ignore) {
					}
			}

			// Any errors will fast-fail and return. If we got here, the test(s) passed.
			Util.sendEventStreamMsg(writer, "cmd", "PASSED");
			return;

		} catch (Exception e) {
			// No way to fail the HTTP call because it has already returned HTTP status code
			// 200 to
			// the client, so we attempt to notify the client of this exception if possible.
			if (writer != null)
				try {
					Util.sendEventStreamMsg(writer, "cmd", "FAIL due to exception: " + e.getMessage());
				} catch (Exception ignore) {
				}

			// Also log it on the server
			System.out.println("Exception runnig test '" + test + "'");
			e.printStackTrace(System.out);
		} finally {
			// No matter what happened, always complete the async request so the client
			// does not wait forever.
			async.complete();
		}

	}

	private static String performTest(SerialPort serialPort, String test) throws ServletException, IOException {
		try {
			serialPort.getOutputStream().write(test.getBytes());
			System.out.println("Test: " + test);
			boolean pass = Util.getMessages(serialPort);
			System.out.println("Test Complete");
			System.out.println("------------------------------------------------------------------");

			if (!pass) {
				return "FAIL: " + test + " unsuccessful";
			}
		} catch (Exception e) {
			return "FAIL: " + e.getMessage();

		}
		return "OK: Test " + test + " passed.";
	}
}
