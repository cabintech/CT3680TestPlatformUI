package com.cabintechglobal.testplatform;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.Map;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

/**
 * Application Lifecycle Listener implementation class ServerEventListener
 *
 */
@WebListener
public class ServerEventListener implements ServletContextListener, Constants {
	
	public static File exeDir = null; // Directory containing the (OS specific) executable files
	// Executable file names
	public static final String EXE_GETSN = "ct3680-getsn.exe";
	public static final String EXE_UPDATER = "ct3680-updater.exe";
	
	private static final Map<String,String> EXE_LIST = Map.of(
			// Map of URL paths to local file names
			CTG_URL+"appfiles/ct3680/"+EXE_GETSN, EXE_GETSN,
			CTG_URL+"appfiles/ct3680/"+EXE_UPDATER, EXE_UPDATER
		);

    /**
     * Default constructor. 
     */
    public ServerEventListener() {
        // TODO Auto-generated constructor stub
    }

	/**
     * This method is called with the server context (e.g. the web application)
     * is starting. It will only be called once. If this method throws any
     * exception server startup will fail.
     */
    public void contextInitialized(ServletContextEvent sce)  { 
		// Formulate the OS specific path within the application temp dir. This file
    	// will be deleted when the server JVM exits (if gracefully, not if killed).
    	try {
    		exeDir = Files.createTempDirectory("CT3680TestPlatformUI").toFile();
    		exeDir.deleteOnExit();
    		System.out.println("Created temp EXE directory: "+exeDir.getAbsolutePath());
    	}
    	catch (Exception e) {
    		throw new RuntimeException("Failed to create temp dir for EXE files.", e);
    	}
    	
		try {
			
			// Download each file in the list
			for (String exeURL: EXE_LIST.keySet()) {
				File targetFile = new File(ServerEventListener.exeDir, EXE_LIST.get(exeURL));
			    
			    HttpClient httpClient = HttpClient.newHttpClient();
			    HttpRequest fileRequest = HttpRequest.newBuilder()
			            .uri(URI.create(exeURL))
			            .GET() 
			            .build();
			    
			    // Send request and write response directly to the target file
			    HttpResponse<Path> fileResponse = httpClient.send(fileRequest, HttpResponse.BodyHandlers.ofFile(targetFile.toPath()));
			    int statusCode = fileResponse.statusCode();
			    if (statusCode > 299) {
			    	throw new RuntimeException("Failed to download EXE files from the CTG server, HTTP status code "+statusCode);
				}
	    		System.out.println("Downloaded EXE file: "+targetFile.getAbsolutePath());

			}
			
			// No errors, all files downloaded OK
		
		} catch (Exception e) {
			throw new RuntimeException("Exception during download of EXE files from CTG server.", e);
		}
    }

	/**
     * This method will be called when the web application is being shutdown.
     */
    public void contextDestroyed(ServletContextEvent sce)  {
    	// Try to cleanup the EXE dir in case the server does not exit cleanly (which
    	// it never does when run in Eclipse).
    	Path directoryPath = exeDir.toPath();
    	try {
    	    Files.walk(directoryPath)
    	         .sorted(Comparator.reverseOrder())
    	         .map(Path::toFile)
    	         .forEach(File::delete);
    	} catch (IOException e) {
    	}
    	System.out.println("Deleted temp directory "+exeDir.getAbsolutePath());
    }
	
}
