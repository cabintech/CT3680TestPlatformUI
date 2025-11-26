package com.cabintechglobal.testplatform;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

import com.fazecast.jSerialComm.SerialPort;

/**
 * Servlet implementation class VerifyDiagStream
 */
public class VerifyDiagStream extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public VerifyDiagStream() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String TEST_DIAG = "TEST_DIAG";
		
		String portDescriptor = "COM20";
        SerialPort serialPort = SerialPort.getCommPort(portDescriptor);
        serialPort.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 0, 0);
        
        if (serialPort.openPort()) {
            System.out.println("Serial port " + portDescriptor + " opened successfully.");
            // Configure port parameters (baud rate, data bits, stop bits, parity)
            serialPort.setBaudRate(9600);

            // Now you can read from or write to the serial port
            // For example, writing a string:
            try {
                serialPort.getOutputStream().write(TEST_DIAG.getBytes());
                System.out.println("Powering module on...");
                boolean pass = Util.getMessages(serialPort);
                System.out.println("Test Complete");
                System.out.println("------------------------------------------------------------------");
                
                if (!pass) {
            		Util.sendTextResponse(response, "FAIL: Module power-on unsuccessful");
            		return;
                }
            } catch (Exception e) {
        		Util.sendTextResponse(response, "FAIL: " + e.getMessage());
        		return;
            }

            // Close the port when done
            serialPort.closePort(); 
            System.out.println("Serial port " + portDescriptor + " closed.");

        } else {
            System.err.println("Failed to open serial port " + portDescriptor);
    		Util.sendTextResponse(response, "FAIL: Could not open serial port.");
    		return;
        }
		Util.sendTextResponse(response, "PASS");
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		doGet(request, response);
	}

}
