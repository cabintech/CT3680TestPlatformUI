package com.cabintechglobal.testplatform;

import com.fazecast.jSerialComm.SerialPort;

public class TestCall {
	
	public static boolean badResult;

	public static void main(String[] args) {
		String TEST_DIAG = "TEST_DIAG";
		String TEST_OPT = "TEST_OPT";
		String TEST_PGM = "TEST_PGM";
		String TEST_SR = "TEST_SR";
		String TEST_TT = "TEST_TT";
		String POWER_OFF = "POWER_OFF";
		String POWER_ON = "POWER_ON";
		String TEST_CV_MIN = "TEST_CV_MIN";
		
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
                serialPort.getOutputStream().write(POWER_ON.getBytes());
                System.out.println("Powering module on...");
                getMessages(serialPort);
                System.out.println("Test Complete");
                System.out.println("------------------------------------------------------------------");
                
                if (badResult) {
                	return;
                }
            	
                serialPort.getOutputStream().write(TEST_DIAG.getBytes());
                System.out.println("Verifying Diagnostic Stream...");
                getMessages(serialPort);
                System.out.println("Test Complete");
                System.out.println("------------------------------------------------------------------");
                
//                serialPort.getOutputStream().write(TEST_CV_MIN.getBytes());
//                System.out.println("Reading CV_MIN...");
//                getMessages(serialPort);
//                System.out.println("Test Complete");
//                
                serialPort.getOutputStream().write(TEST_OPT.getBytes());
                System.out.println("Verifying option switches...");
                getMessages(serialPort);
                System.out.println("Test Complete");
                System.out.println("------------------------------------------------------------------");
                
                serialPort.getOutputStream().write(TEST_PGM.getBytes());
                System.out.println("Verifying program selection...");
                getMessages(serialPort);
                System.out.println("Test Complete");
                System.out.println("------------------------------------------------------------------");
                
                serialPort.getOutputStream().write(TEST_SR.getBytes());
                System.out.println("Verifying sampling rates...");
                getMessages(serialPort);
                System.out.println("Test Complete");
                System.out.println("------------------------------------------------------------------");
                
                serialPort.getOutputStream().write(TEST_TT.getBytes());
                System.out.println("Verifying tap tempo...");
                getMessages(serialPort);
                System.out.println("Test Complete");
                System.out.println("------------------------------------------------------------------");
                
                //Thread.sleep(5000);
                serialPort.getOutputStream().write(POWER_OFF.getBytes());
                getMessages(serialPort);
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
	 * Arduino Serial.println() sends 2 line ending charcters, \r (return) followed
	 * by \n (newline), in that order.
	 * @param serialPort
	 * @return
	 */
	private static String readLine(SerialPort serialPort) {
        byte[] singleBuffer = new byte[1];
        String line = "";
		while (true) {
	        int len = serialPort.readBytes(singleBuffer, 1); // Waits indefinitely for a byte to arrive
	        if (len != 1) {
	        	//System.out.println("Read zero bytes");
	        	try {Thread.currentThread().sleep(100);} catch (Exception e) {}
	        	continue;
	        }

	        if (singleBuffer[0] == '\r') { // End of line
	        	serialPort.readBytes(singleBuffer,  1); // Read final \n character
	        	break;
	        }
	        
	        line += (char)singleBuffer[0];
		}
		return line;
	}

	private static void getMessages(SerialPort serialPort) {
        while (true) {
        	String resp = readLine(serialPort);
        	System.out.println("Response received '"+resp+"'");
        	if (resp.substring(0,2).equals("OK")) {
        		break;
        	}
        	else if (resp.substring(0,5).equals("ERROR")) {
        		badResult = true;
        		break;
        	}
        }
	}
}
