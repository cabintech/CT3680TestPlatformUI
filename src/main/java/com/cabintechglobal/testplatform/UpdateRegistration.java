package com.cabintechglobal.testplatform;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kong.unirest.HttpResponse;
import kong.unirest.Unirest;

/**
 * Servlet implementation class UpdateRegistration
 */
@WebServlet("/UpdateRegistration")
public class UpdateRegistration extends HttpServlet implements Constants {
	private static final long serialVersionUID = 1L;
	
	private static String encodedCreds = "";
	static {	
        Path filePath = Paths.get("C:\\creds\\ctCreds.txt");

        try {
            encodedCreds = Files.readString(filePath);
        } catch (IOException e) {
            System.err.println("Error reading file: " + e.getMessage());
        }
	}
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public UpdateRegistration() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

		if (encodedCreds.length() == 0) {
			Util.sendServerErrorResponse(request, response, "Server credentials not available");
			return;
		}
		
		String serialNumber = Util.safeStr(request.getParameter("sn")).trim();
		//String version = Util.safeStr(request.getParameter("version")).trim();
		String option = Util.safeStr(request.getParameter("option")).trim();
		 
//        Endpoint: /priv/CT3680Register
//
//        URL parameters
//        product=CT3680
//        sn=0X0000xxxx
//        version=2.1A or 2.1B
//        option=new or update
        
		//for testing purposes, remove once integration is verified
		serialNumber = "0X1" + serialNumber.substring(3);
		
		serialNumber = URLEncoder.encode(serialNumber, StandardCharsets.UTF_8);
		String version = URLEncoder.encode("2.1B", StandardCharsets.UTF_8);
		option = URLEncoder.encode(option, StandardCharsets.UTF_8);
        
		String parms = "?product=CT3680&sn=" + serialNumber + "&version=" + version + "&option=" + option;
		HttpResponse<String> serverResponse = Unirest.
				get(CTG_URL+"priv/CT3680Register"+parms).
				header("Authorization", "Basic "+encodedCreds).
				asString();
		
		if (serverResponse.getStatus() == 200) {
			Util.sendTextResponse(response, "");
			return;
		}
		else {
			Util.sendServerErrorResponse(request, response, "Cabintech server returned HTTP status" + serverResponse.getStatus());
			return;
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		doGet(request, response);
	}

}
