package com.cabintechglobal.testplatform;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;

import jakarta.servlet.AsyncContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Updates the attached CT3680 module via the ct3680-updater.exe program (see Update3680 class in the update3680 project).
 * This is a SSE (Server Sent Events) endpoint. It will send status message back the client as the module update
 * progresses using the Content-Type ""text/event-stream". The response is not completed until the update is done or it
 * fails.
 * 
 * The browser Javascript client uses an EventSource object to invoke this servlet and listen for events this servlet produces. 
 * 
 * References for the design of this servlet:
 * 
 * Async servlets: https://docs.oracle.com/javaee/7/tutorial/servlets012.htm
 * Server Sent Events: 
 *   (Java server): https://medium.com/codimis/what-is-server-sent-event-sse-and-how-to-use-it-in-java-spring-boot-7f4ffa828882 (note my comment on that post)
 *   (client side): https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events 
 *   
 * The updater is a native executable (.exe) that connects to the USB-attached CT3680 module and downloads firmware packages from
 * the Cabintech server and installs them into the module. The exe encapsulates (and helps secure) the process so that our
 * firmware cannot be intercepted and installed on non-CT3680 FXCore processors.
 * 
 * The exe will write JSON formatted status/error messages to STDOUT, while log messages are written to STDERR. The process return
 * code is zero if the update completed successfully, otherwise non-zero which indicates a failure.
 */
@WebServlet(urlPatterns = "/UpdateModule", asyncSupported = true)
public class UpdateModule extends HttpServlet implements Constants {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public UpdateModule() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		
		System.out.println("Entering UpdateModule.doGet");
		String fwVersion = Util.safeStr(request.getParameter("fwversion")).trim();
		String server = Util.safeStr(request.getParameter("server")).trim();
		
		String serverArg = (server.length()==0) ? "" : "server="+server; // Arg format expected by main() of updater EXE 
		
		// Tell Tomcat not to commit the response when this method returns
		final AsyncContext async = request.startAsync();
		
		async.setTimeout(60*5*1000); // Timeout this operation if it does not complete in 5 minutes
		async.start(() -> {
			//System.out.println("Starting async thread");

			// This code will run on a server-supplied thread and continues even after the doGet() returns. 
			// It can continue to run for up to the time limit without consuming an HTTP listener thread, 
			// and it can generate incremental updates to send to the client.
			
		    response.setContentType("text/event-stream");
		    response.setHeader("Cache-Control","no-cache");
		    response.setCharacterEncoding("UTF-8");
		    
		    PrintWriter writer = null;
		    try {
			    writer = response.getWriter();
			    
				// Verify the executable is where we expect it
				File getSNExe = new File(ServerEventListener.exeDir, ServerEventListener.EXE_UPDATER);
				if (!getSNExe.exists()) {
					// Notify the client by emulating the structure the updater uses for status 
					Util.sendEventStreamMsg(writer, new SafeMap("status","failed","msg","Executable file not found as expected at '"+getSNExe.getAbsolutePath()+"'."));
					return;
				}

				// Run the executable, it's STDOUT will be written to the event stream
				String ver = fwVersion.length()==0 ? "" : "ver="+fwVersion;
				StringBuilder stdErr = new StringBuilder();
				int exitCode = runProcess(new String[] {getSNExe.getAbsolutePath(), "output=json", ver, serverArg}, getSNExe.getParentFile(), writer, stdErr);
				
				// A non-zero means it failed, but it (should have) written the error messages to the event stream. If the client
				// wants to show diagnostics, we supply the stdErr output as a "diag" message before closing the stream.
				if (exitCode != 0) {
					Util.sendEventStreamMsg(writer, new SafeMap("status","diag","msg",stdErr.toString()+"<br>Process exit code "+exitCode));
				}
		    }
		    catch (Exception e) {
		    	e.printStackTrace(System.err);
			    // Note the HTTP status code (200) was sent when we opened the event stream, there is
			    // no way to send a different status now. Just tell the client about it (if possible).
		    	if (writer != null) try {
					Util.sendEventStreamMsg(writer, new SafeMap("status","failed","msg","Unexpected exception in server: "+e.getClass().getName()));
					Util.sendEventStreamMsg(writer, new SafeMap("status","diag","msg",Util.getStackTrace(e)));
		    	}
		    	catch (Exception ignore) {
		    		// Last ditch effort to report this failure. Not sure where or if this will be visible
					System.out.println("Unexpected exception in tce server: "+e.getClass().getName());
					e.printStackTrace(System.out);
		    	}
		    }
		    finally {
		    	// Must be sure to complete the response so the client will not wait indefinitely
				async.complete(); 
		    }
			
		});
		//System.out.println("Leaving UpdateModule.doGet");
	}
	
	/**
	 * Similar to Util.runProcess() but specialized to send event stream status messages from the process's stdout.
	 * @param cmdTokens
	 * @param workingDir
	 * @param writer
	 * @param logMsgs
	 * @return
	 * @throws IOException
	 */
	private static int runProcess(String[] cmdTokens, File workingDir, PrintWriter writer, StringBuilder logMsgs) throws IOException {
		
        ProcessBuilder pb = new ProcessBuilder(cmdTokens);
        
        // Set the working directory for the process if supplied
        if (workingDir != null) {
        	pb.directory(workingDir);
        }

        Process process = pb.start();

        // --- Capture STDOUT ---
        BufferedReader stdoutReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String line;
        while ((line = stdoutReader.readLine()) != null) {
        	// Send this data to the client via the servlet event stream. All STDOUT are JSON strings.
        	Util.sendEventStreamMsg(writer, line);
        }
        //System.out.println("STDOUT Captured:\n" + stdout.toString());

        // --- Capture STDERR ---
        BufferedReader stderrReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
        while ((line = stderrReader.readLine()) != null) {
        	// Send this data to the log message accumulator
        	logMsgs.append(line+"<br>");
        }
        //System.out.println("STDERR Captured:\n" + stderr.toString());

        // Wait for the process to complete
        try {
        	return process.waitFor();
        }
        catch (InterruptedException ignore) {
        	throw new RuntimeException("Process was interrupted."); // Very unlikely
        }
	}

}
