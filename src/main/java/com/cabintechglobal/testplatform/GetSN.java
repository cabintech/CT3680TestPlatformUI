package com.cabintechglobal.testplatform;

import java.io.File;
import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Gets the serial number (via ct3680-getsn.exe, see the GetSN3680 class in the update3680 project). That executable will connect via USB to an attached
 * CT3680 module and read the serial number. It will then connect to the Cabintech server and get the
 * module registration details (last loaded firmware rev, etc).
 * 
 * It will output a JSON structure to STDOUT, and log messages to STDERR. It will always produce the JSON
 * data even if there were failures. The process RC will be non-zero only if it was unable to produce the JSON.
 * 
 * The JSON data sent to STDOUT will be:
 * {
 * 		status: "ok"|"noconnect"|"noreg"|"failed"
 * 		msg: "SN not recognized, contact Cabintech for help"
 * 		sn: "0X0000F43D"
 * 		hwver: "beta"
 * 		fwver: "beta3"
 * 		curravail: "beta4
 * }
 * 
 * ok = Module SN was extracted from module, and CTG server supplied all metadata
 * noconnect = Unable to connect to the module (many possible reasons)
 * noreg = No registration data found
 * failed = Unexpected failure, show the user the msg, log (STDERR) will have more details
 *
 * That JSON structure will be passed back to the client as-is with one field "log" added
 * which will be the STDERR (log message) output. 
 * 
 */
//TODO: Create a common project to hold getsn and update program constants that can be used here.
@WebServlet("/GetSN")
public class GetSN extends HttpServlet implements Constants {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public GetSN() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

		Util.sendTextResponse(response, readSNLocal());
	}
	
	/**
	 * Use this machines USB ports to try to get the module SN.
	 * @return
	 */
	public static String readSNLocal() {
		
		try {
			// Verify the executable is where we expect it
			File getSNExe = new File(ServerEventListener.exeDir, ServerEventListener.EXE_GETSN);
			if (!getSNExe.exists()) {
				return "FAIL: Executable file not found.";
			}
			
			// Run the executable and capture the output
			StringBuilder stdOut = new StringBuilder();
			StringBuilder stdErr = new StringBuilder();
			
			Util.runProcess(new String[] {getSNExe.getAbsolutePath()}, getSNExe.getParentFile(), null, stdOut, stdErr);
			
			// Expected JSON map to be written to stdout
			SafeMap resultsMap = SafeMap.fromJson(stdOut.toString());
			if (resultsMap.size() == 0) {
				return "FAIL: Serial number processor did not produce the expected results."+stdErr.toString();
			}
			
			String status = resultsMap.getStr("status");
			String sn = resultsMap.getStr("sn");
			String msg = resultsMap.getStr("msg");
			
			if (status.equals("ok")) {
				return "PASS: "+sn;
			}
			else {
				return "FAIL: "+msg;
			}
		
		} catch (Exception e) {
			return "FAIL: Exception: "+e.getMessage();
		}
	}


} // end of class
