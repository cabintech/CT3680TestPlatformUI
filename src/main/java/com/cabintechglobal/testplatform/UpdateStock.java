package com.cabintechglobal.testplatform;

import java.io.IOException;
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
 * Increments the CT3680 stock level in the CTG production database by 1. A response with
 * status 200 means the update was successful, any other HTTP status code indicates failure.
 */
@WebServlet("/UpdateStock")
public class UpdateStock extends HttpServlet implements Constants {
	private static final long serialVersionUID = 1L;
	
    /**
     * @see HttpServlet#HttpServlet()
     */
    public UpdateStock() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

		if (ServerEventListener.encodedCreds.length() == 0) {
			Util.sendServerErrorResponse(request, response, "Server credentials not available");
			return;
		}
		 
		String parms = "?sku=CT3680&value=1&type=count";
		HttpResponse<String> serverResponse = Unirest.
				get(CTG_URL+"priv/AddProductStock"+parms).
				header("Authorization", "Basic "+ServerEventListener.encodedCreds).
				asString();
		if (serverResponse.getStatus() < 299) {
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
