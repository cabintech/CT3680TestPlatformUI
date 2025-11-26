package com.cabintechglobal.testplatform;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.Reader;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.StringJoiner;
import java.util.stream.Stream;

import org.apache.tomcat.jakartaee.bcel.Constants;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fazecast.jSerialComm.SerialPort;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class Util implements Constants {
	
	private static volatile boolean initHttpClientSSL = false;
	private static Object lockHttpClientSSL = new Object();
	/**
	 * No instances allowed, only static methods and data.
	 */
	private Util() {
		
	}

	/**
	 * Returns TRUE if the input string is null or contains
	 * only white space, otherwise returns FALSE.
	 * @param str
	 * @return
	 */
	public static final boolean isEmpty(String str) {
		if ((str==null) || (str.trim().length()==0)) {
			return true;
		}
		return false;
	}
	
	/**
	 * Safe, case-sensitive, trimmed string compare. Note that NULL will
	 * be considered equal to an empty string.
	 * @param s1
	 * @param s2
	 * @return
	 */
	public static final boolean isSame(String s1, String s2) {
		return safeStr(s1).trim().equals(safeStr(s2).trim());
	}
	
	public static final boolean isSame(Date d1, Date d2) {
		if (d1==null && d2==null) {
			return true;
		}
		if (d1==null) return false;
		if (d2==null) return false;
		
		return (d1.getTime()==d2.getTime());
	}
	
	/**
	 * Return non-null String reference. If input is null returns
	 * an empty string, otherwise returns the input string.
	 * @param str
	 * @return
	 */
	public static final String safeStr(String str) {
		if (str == null) return "";
		return str;
	}
	
	/**
	 * Return non-null String reference. If first arg is null, the
	 * second arg is returned, unless it is also null in which case
	 * an empty string is returned.
	 * @param str
	 * @param alternate
	 * @return
	 */
	public static final String safeStr(String str, String alternate) {
		if (str != null) return str;
		if (alternate != null) return alternate;
		return "";
	}
	
	public static final void sendNotFoundResponse(HttpServletRequest request, HttpServletResponse response, String details) throws IOException {
		//TODO: Log ip address of request?
		response.setStatus(404);
		response.setContentType("text/plain");  // Set content type of the response 
		response.setCharacterEncoding("UTF-8"); 
		response.getWriter().write(details==null ? "Requested data not found": details);
	}
	
	public static final void sendBadRequestResponse(HttpServletRequest request, HttpServletResponse response, String details) throws IOException {
		//TODO: Log ip address of request?
		response.setStatus(400);
		response.setContentType("text/plain");  // Set content type of the response 
		response.setCharacterEncoding("UTF-8"); 
		response.getWriter().write(details==null ? "Request could not be understood by the server": details);
	}
	
	public static final void sendNotAuthorizedResponse(HttpServletRequest request, HttpServletResponse response, String details) throws IOException {
		//TODO: Log ip address of request?
		response.setStatus(401);
		response.setContentType("text/plain");  // Set content type of the response 
		response.setCharacterEncoding("UTF-8"); 
		response.getWriter().write(details==null ? "User is not authorized": details);
	}
	
	public static final void sendServerErrorResponse(HttpServletRequest request, HttpServletResponse response, String details) throws IOException {
		//TODO: Log ip address of request?
		response.setStatus(500);
		response.setContentType("text/plain");  // Set content type of the response 
		response.setCharacterEncoding("UTF-8"); 
		response.getWriter().write(details==null ? "Internal server error": details);
	}
	
	/**
	 * Encapsulates boilerplate to send a JSON response body back to the 
	 * client with an OK HTTP status code. Note that no further response
	 * can be made after this method runs.
	 * @param httpResp
	 * @param body
	 * @throws IOException
	 */
	public static final void sendJsonResponse(HttpServletResponse httpResp, String body) throws IOException {
		httpResp.setContentType("application/json");  // Set correct content type of the response 
		httpResp.setCharacterEncoding("UTF-8"); 
		httpResp.setStatus(HttpServletResponse.SC_OK);
		httpResp.getWriter().write(body); 
	}	
	
	/**
	 * Encapsulates boilerplate to send a text response body back to the 
	 * client with an OK HTTP status code. Note that no further response
	 * can be made after this method runs.
	 * @param httpResp
	 * @param body
	 * @throws IOException
	 */
	public static final void sendTextResponse(HttpServletResponse httpResp, String body) throws IOException {
		httpResp.setContentType("text/plain");  // Set content type of the response 
		httpResp.setCharacterEncoding("UTF-8"); 
		httpResp.getWriter().write(body); 
	}
	
	/**
	 * Values which are passed as JSON strings must have some quoting characters escaped or the browser
	 * will not be able to parse the JSON response. This is only needed when we build JSON strings
	 * from scratch instead of using the Jackson serializer.
	 * @param inputJson
	 * @return
	 */
	public static final String escapeJson(String inputJson) {
		return inputJson.replace("'", "\\'").replace("\"", "\\\"").replace("\\", "\\\\").replace("/", "\\/");
	}
	
	/**
	 * Get stack trace of an exception as a simple String.
	 * @param t
	 * @return
	 */
	public static  String getStackTrace(Throwable t) {
		try (StringWriter sw = new StringWriter()) {
			PrintWriter pw = new PrintWriter(sw);
			t.printStackTrace(pw);
			return sw.toString(); // stack trace as a string
		}
		catch (IOException ioe) {
			return "<Unable to obtain stack trace.>";
		}
	}
	
	/**
	 * Returns a full message and stack trace for the given exception as
	 * a simple string, lines are terminated with \n. 
	 * @param t
	 * @return
	 */
	public static final String getExceptionMsg(Throwable t) {
		String msg = t.getMessage();
		if (msg == null) { // If no message, best we can do is the exception type name
			msg = t.getClass().getName();
		}
		return msg + "\n" + getStackTrace(t);
	}
	
	/**
	 * Provides common exception handling for the primary doGet() and doPost() methods of
	 * servlets. This should be used only for unexpected software failures. The exception
	 * information will be logged in the server log and an HTTP 500 (server error) code
	 * will be sent in the response with a brief message.
	 * @param request
	 * @param response
	 * @param t
	 * @param className
	 * @throws IOException 
	 */
	public static void handleServletException(HttpServletRequest request, HttpServletResponse response, Throwable t, HttpServlet servlet) throws IOException {
		
		// If the servlet has not already sent a response to the client, send a failure response.
		if (!response.isCommitted()) {
			response.reset();
			Util.sendServerErrorResponse(request, response, t.getMessage());
		}
	}
	
	/**
	 * Serializes the given object into a JSON format String. 
	 * @param obj
	 * @return
	 * @throws JsonProcessingException
	 */
	public static final String serializeToJson(Object obj) throws JsonProcessingException {
		// Run the Jackson mapper
		ObjectMapper m = new ObjectMapper();
		m.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS); // Write dates in ISO-8601 (readable) format
		return m.writeValueAsString(obj);
		
	}
	
	/**
	 * Reads a JSON string and constructs a Map representation of the JSON structure.
	 * @param json
	 * @return
	 * @throws Throwable
	 */
	public static final SafeMap deserializeFromJson(String json) throws Throwable {
		return new ObjectMapper().readValue(json, SafeMap.class);
	}
	public static final Map<String,List<SafeMap>> deserializeProductListFromJson(String json) throws Throwable {
		return new ObjectMapper().readValue(json, new TypeReference<Map<String,List<SafeMap>>>(){});
	}
	
	/**
	 * Reads a JSON string and constructs a List representation of the JSON structure.
	 * This assumes the string starts with "[", e.g. is a JSON list structure. 
	 * @param json
	 * @return
	 * @throws Throwable
	 */
	public static final ArrayList deserializeListFromJson(String json) throws Throwable {
		return new ObjectMapper().readValue(json, ArrayList.class);
	}

	
	
	/**
	 * Note this consumes the body of the request if it is posted form data.
	 * @param httpRequest
	 * @param writer
	 * @throws Throwable
	 */
	public static void printRequest(HttpServletRequest httpRequest, PrintWriter writer) throws Throwable {
		
        writer.println("URI: "+ httpRequest.getRequestURI());


        writer.println("\n\nHeaders:");

        Enumeration headerNames = httpRequest.getHeaderNames();
        while(headerNames.hasMoreElements()) {
            String headerName = (String)headerNames.nextElement();
            writer.println(headerName + " = " + httpRequest.getHeader(headerName));
        }

        writer.println("\n\nParameters:");

        Enumeration params = httpRequest.getParameterNames();
        while(params.hasMoreElements()){
            String paramName = (String)params.nextElement();
            writer.println(paramName + " = " + httpRequest.getParameter(paramName));
        }

        writer.println("\n\nBody:");
        writer.println(extractPostRequestBody(httpRequest, writer));
    }
	
	static String convertStreamToString(java.io.InputStream is) throws IOException {
	    java.util.Scanner s = new java.util.Scanner(is, "UTF-8").useDelimiter("\\A");
	    String answer = s.hasNext() ? s.next() : "";
	    is.close();
	    return answer;
	}

    private static String extractPostRequestBody(HttpServletRequest request, PrintWriter writer) throws IOException {
        if ("POST".equalsIgnoreCase(request.getMethod())) {
            Scanner s = null;
            s = new Scanner(request.getInputStream(), "UTF-8").useDelimiter("\\A");
            return s.hasNext() ? s.next() : "";
        }
        return "";
    }	
    
  
	/**v8.82
	 * Returns a formatted string assuming the input is a decimal number
	 * in string format. The value will be formatted to 2 decimal
	 * places, e.g. "3.1" will return "3.10".
	 * 
	 * If the amount is null, empty string, or invalid number, "0.00" is returned.
	 * @param amount
	 * @return
	 */
	public static final String toUSD(String amount) {
		double v = 0.0;
		try {
			v = Double.parseDouble(amount);
		}
		catch (Throwable ignore) {}
		
		return toUSD(v);
	}
	
	/**v8.82
	 * Returns a formatted string to 2 decimal places, e.g. the value 3.1
	 * would return "3.10".
	 * @param amount
	 * @return
	 */
	public static final String toUSD(double amount) {
		BigDecimal bd = new BigDecimal(amount).setScale(2, RoundingMode.HALF_UP);
		return bd.toPlainString();
	}
 
	/**
	 * Read the full content of an input stream into a Java String.
	 * @param is
	 * @return
	 * @throws IOException
	 */
	public static String readStreamBytesToString(InputStream is) throws IOException {
		final int bufferSize = 1024;
		final char[] buffer = new char[bufferSize];
		final StringBuilder out = new StringBuilder();
		try (Reader in = new InputStreamReader(is, "UTF-8")) {
			for (; ; ) {
			    int rsz = in.read(buffer, 0, buffer.length);
			    if (rsz < 0)
			        break;
			    out.append(buffer, 0, rsz);
			}
		}
		return out.toString();		
	}


	/**
	 * Navigates a mapped Json structure to return a String from a sub-element
	 * of the structure. The string arguments form a named path through the structure.
	 * It is assumed that all nodes except the last are Map<String,Object>, and the 
	 * last is String.
	 * 
	 * @param jsonMap
	 * @param path
	 * @return
	 */
	public static final String getJsonStr(Map<String,Object> jsonMap, String...path) {
		
		// Navigate to almost last node
		Map<String,Object> lastNode = getJsonMap(jsonMap, Arrays.copyOf(path, path.length-1));
		
		// Last element is the String of interest
		return (String)lastNode.get(path[path.length-1]);
	}

	/**
	 * Navigates a mapped Json structure to return a sub-element
	 * of the structure. The string arguments form a named path through the structure.
	 * 
	 * @param jsonMap
	 * @param path
	 * @return
	 */
	public static final Map<String,Object> getJsonMap(Map<String,Object> jsonMap, String...path) {
		Map<String,Object> next = jsonMap;
		for (int i=0; i<path.length; i++) {
			if (path[i].contains("[")) {
				// Next element is an array specification. This assumes the indexed array item
				// it not itself an array.
				String indexStr = path[i].substring(path[i].indexOf("[")+1,path[i].indexOf("]"));
				String indexName = path[i].substring(0, path[i].indexOf("["));
				List<Map<String,Object>> list = (List<Map<String,Object>>)next.get(indexName);
				next = list.get(Integer.parseInt(indexStr));
			}
			else {
				next = (Map<String,Object>)jsonMap.get(path[i]);
			}
		}
		return next;
	}

	/**
	 * Recurrsive routine to generate the JSON for a Map<String,Object> where the
	 * Object and be String (single level map) or another Map<String,Object>, to
	 * any depth. Note that map keys are always strings.
	 * 
	 * Results are appended to the given string buffer.
	 * @param map
	 * @param s
	 */
	private static final void generateJSForMap(Map<String, Object> map, StringBuffer s) {
		// Output Javascript object notation (JSON) for a map, assuming Map<String,String>
		s.append("{");
		for (Map.Entry<String,Object> entry: ((Map<String,Object>)map).entrySet()) {
			if (entry.getValue() instanceof String) {
				s.append('"'+entry.getKey()+"\":\""+entry.getValue()+"\",");
			}
			else if (entry.getValue() instanceof Map) {
				//v7.02 nested map
				s.append('"'+entry.getKey()+"\":");
				generateJSForMap((Map<String,Object>)entry.getValue(), s);
				s.append(",");
			}
		}
		s.setLength(s.length()-1); // Trim last comma
		s.append("}");

	}
	
	/**
	 * String to double converter that will never throw. If input string is null,
	 * empty, or invalid numeric, this method returns 0.0.
	 * @param s
	 * @return
	 */
	public static final double safeDouble(String s) {
		if (s==null || s.trim().length() == 0) return 0.0;
		try {
			return Double.parseDouble(s);
		}
		catch (Throwable t) {
			return 0.0;
		}
	}

	/**
	 * Returns comma delimited list of the array element's toString() results. E.g.
	 * the array does not have to be of type String, the list will have each object's
	 * toString() value.
	 * @param list
	 * @return
	 */
	public static String getArrayElementsList(Object[] list) {
    	StringJoiner sj = new StringJoiner(",");
    	Stream.of(list).forEach(x -> sj.add(x.toString()));
		return sj.toString();
	}
	
	/**
	 * Convenience method to init a new SafeMap. Note keys must be Strings
	 * @param nameVals
	 * @return
	 */
	public static final SafeMap makeSafeMap(Object ...nameVals) {
		if (nameVals.length % 2 != 0) {
			throw new RuntimeException("Invalid number of args to makeStringMap()");
		}
		SafeMap m = new SafeMap();
		for (int i=0; i<nameVals.length; i=i+2) {
			m.put((String)nameVals[i],  nameVals[i+1]);
		}
		
		return m;
		
	}

	public static String getResourceAsString(String fileName) throws IOException {
		try (InputStream is = Util.class.getClassLoader().getResourceAsStream(fileName)) {
			Scanner s = new Scanner(is).useDelimiter("\\A");
			String result = s.hasNext() ? s.next() : "";
			return result;
		}
	}
	
	public static boolean getMessages(SerialPort serialPort) {
        while (true) {
        	String resp = readLine(serialPort);
        	System.out.println("Response received '"+resp+"'");
        	if (resp.substring(0,2).equals("OK")) {
        		return true;
        	}
        	else if (resp.substring(0,5).equals("ERROR")) {
        		return false;
        	}
        }
	}
	
	/**
	 * Writes a JSON text event-stream formatted message to the given writer with no event type
	 * or event id.
	 * @param writer
	 * @param dataMap
	 * @throws IOException
	 */
	public static final void sendEventStreamMsg(PrintWriter writer, SafeMap dataMap) throws IOException {
		sendEventStreamMsg(writer, dataMap==null ? null : dataMap.toJson(), null,  null);
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
	
	/**
	 * Writes a plain text event-stream formatted message to the given writer with no event type
	 * or event id.
	 * @param writer
	 * @param dataMap
	 * @throws IOException
	 */
	public static final void sendEventStreamMsg(PrintWriter writer, String data) throws IOException {
		sendEventStreamMsg(writer, data, null,  null);
	}
	
	/**
	 * Writes an event stream message as a JSON map of the supplied key value pairs. The list of
	 * pairs must have a size that is an even number.
	 * or event id.
	 * @param writer
	 * @param dataMap
	 * @throws IOException
	 */
	public static final void sendEventStreamKVs(PrintWriter writer, Object... keyValuePairs) throws IOException {
		SafeMap m = new SafeMap();
		for (int i=0; i<keyValuePairs.length; i=i+2) {
			Object key = keyValuePairs[i];
			Object val = keyValuePairs[i+1];
			if (!(keyValuePairs[i] instanceof String)) {
				throw new RuntimeException("Key is not of type String (is type "+key.getClass().getName()+")");
			}
			m.put((String)key,  val);
		}
		sendEventStreamMsg(writer, m);
	}
	
	/**
	 * A convience method for sendEventStreamMsg() that takes a SafeMap payload instead of a String.
	 * The given content map is serialized to JSON text, which is then sent to the client in the event
	 * stream. If the content map is null, then only a comment message is sent (to, for example, prevent
	 * the connection from timing out).
	 * 
	 * @param httpResp
	 * @param eventType
	 * @param contentMap Map of data to be sent as a JSON text string
	 * @param eventId
	 */
	public static final void sendEventStreamMsg(PrintWriter writer, SafeMap dataMap, String eventType, String eventId) throws IOException {
		sendEventStreamMsg(writer, dataMap==null ? null : dataMap.toJson(), eventType,  eventId);
	}
	
	public static final void sendEventStreamMsg(PrintWriter writer, int data) throws IOException {
		writer.print(data);
		writer.flush(); // Force output stream content to be written to the client. For an event-stream this does not commit the HTTP response.
	}
	
	/**
	 * Sends a single message on a "text/event-stream" type connection. An event stream is formatted as a series of messages:
	 * 
	 *    event: eventType-1
	 *    data: content-1-line1
	 *    data: content-1-line2
	 *    id: eventId-1
	 *    
	 *    event: eventType-2
	 *    data: content-2
	 *    id: eventId-2
	 *    
	 *    
	 * Note that new-line characters are important in the protocol. Each line starts with an element name, followed by
	 * a colon, followed by the text for that element. (All the online examples include a space after the colon but it is
	 * not clear if it is required by the protocol. There is no formal RFC, so we assume the blank is required.) 
	 * 
	 * Note the text cannot itself contain a new-line or it will break
	 * the protocol. Content containing a "\n" must have the "\n" replaced with "\ndata:" to insure the protocol is not violated.
	 * 
	 * Each message is terminated by 2 consecutive new-lines "\n\n".
	 * 
	 * Event types and ids are optional, if null is passed those lines will not be generated.
	 * If content is null, a single ":" is sent which the client will ignore but can be used to prevent the connection from timing out.
	 * 
	 * Client side javascript using the SSE library will register for events based on the event type (the default is "message"). The
	 * event object will have a 'data' member which is the re-constructed data string with multiple :data lines rebuilt into
	 * a single string with embedded newline characters. Non-default event types should only be used if the client is expected
	 * to setup multiple listeners (one for each type).
	 * 
	 * @param httpResp
	 * @param eventType
	 * @param data
	 * @param eventId
	 */
	
	public static final void sendEventStreamMsg(PrintWriter writer, String data, String eventType, String eventId) throws IOException {
		StringBuilder sb = new StringBuilder();

		if (data != null) {
			// Sanitize args
			eventType = eventType==null ? null : eventType.replace("\n", ""); // Cannot have newlines in event type name
			eventId = eventId==null ? null : eventId.replace("\n","");
			data = data.replace("\n", "\ndata:");
			
			if (eventType != null) sb.append("event: "+eventType+"\n");
			if (eventId != null) sb.append("id: "+eventId+"\n");
			sb.append("data: "+data+"\n\n");
		}
		else {
			// Null content means to send just a comment message, often used to prevent connection timeouts
			sb.append(": no content");
		}
		//System.out.println("Sending event stream message\n-----\n"+sb.toString()+"\n-----\n");
		
		writer.print(sb.toString());
		writer.flush(); // Force output stream content to be written to the client. For an event-stream this does not commit the HTTP response.
		
	}
}