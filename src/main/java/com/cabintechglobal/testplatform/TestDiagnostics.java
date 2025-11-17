package com.cabintechglobal.testplatform;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

import com.fazecast.jSerialComm.SerialPort;

/**
 * Servlet implementation class TestDiagnostics
 */
public class TestDiagnostics extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public TestDiagnostics() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		String TEST_DIAG = "TEST_DIAG";
		
		String portDescriptor = "COM20";
        SerialPort serialPort = SerialPort.getCommPort(portDescriptor);
        
        if (serialPort.openPort()) {
            System.out.println("Serial port " + portDescriptor + " opened successfully.");
            // Configure port parameters (baud rate, data bits, stop bits, parity)
            serialPort.setBaudRate(9600);

            // Now you can read from or write to the serial port
            // For example, writing a string:
            try {
                serialPort.getOutputStream().write(TEST_DIAG.getBytes());
                System.out.println("Verifying Diagnostic Stream...");
                
                String resp = readLine(serialPort);
                System.out.println("Response was '"+resp+"'");
                
                //Thread.sleep(5000);
                //serialPort.getOutputStream().write(POWER_OFF.getBytes());
                //System.out.println("Power Off");
            } catch (Exception e) {
                e.printStackTrace();
            }

            // Close the port when done
            serialPort.closePort(); 
            System.out.println("Serial port " + portDescriptor + " closed.");

        } else {
            System.err.println("Failed to open serial port " + portDescriptor);
        }
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		doGet(request, response);
	}

	String readLine(SerialPort serialPort) {
        byte[] singleBuffer = new byte[1];
        singleBuffer[0] = ' ';
        String line = "";
		while (singleBuffer[0] != '\n') {
	        serialPort.readBytes(singleBuffer, 1); // Waits indefinitely for a byte to arrive
	        if (singleBuffer[0] != '\n') {
		        line += (char)singleBuffer[0];
	        }
		}
		return line;
	}
}
