
var util = { // Put utility functions in a name space

	localStorageEnabled: true, //v8.56
	
	htmlEntityMap : {
			  '&': '&amp;',
			  '<': '&lt;',
			  '>': '&gt;',
			  '"': '&quot;',
			  "'": '&#39;',
			  '/': '&#x2F;',
			  '`': '&#x60;',
			  '=': '&#x3D;'
	},
	
	/**
	 * Enables/disables all access to local browser storage.
	 */
	enableLocalStorage: function(enable) {
		localStorageEnabled = enable;
	},
	
	/**
	 * Returns true IFF local storage is enabled in this browser.
	 */
	isLocalStorageEnabled: function() {
		return util.localStorageEnabled;
	},
	
	/**
	 * Sets the value for a key in local storage. If LS is
	 * disabled, this method does nothing.
	 */
	localStorageSet: function(key, value) {
		if (this.localStorageEnabled) try {
			localStorage.setItem(key, value);
		} catch (ignore) {}
	},
	
	/**
	 * Returns the value of the given key from local storage. If LS is
	 * disabled, returns null.
	 */
	localStorageGet: function(key) {
		if (this.localStorageEnabled) try {
			return localStorage.getItem(key);
		} catch (ignore) {}
		return null;
	},
	
	/**
	 * Removes the value for a key in local storage. If LS is
	 * disabled, this method does nothing.
	 */
	localStorageRemove: function(key) {
		if (this.localStorageEnabled) try {
			localStorage.removeItem(key);
		} catch (ignore) {}
	},	
		
	// Analyize a JQuery server call failure and return human readable text
	getServerErrorText : function(xhr, status, error) {
		var t = "Unknown error.";
		if (xhr.status == 0) {
			// An HTTP status code of zero in this fail mode means we could
			// not get an HTTP
			// response from the server at all, e.g. most likely a network
			// error.
			t = "Failed to contact server, connection failed."; //, error="+error+", xhr="+util.serializeToStr(xhr);
		} else {
			t = xhr.responseText;
			if (t == undefined) {
				t = "";
			} else {
				t = "Addintional info: " + t;
			}
			t = "Server call Failed, server returned error code "
					+ xhr.status + " (" + xhr.statusText + "). " + t;
		}
		return t;
	},
	
	// Analyize a JQuery server call failure and return human readable text but only
	// the basic HTTP code and its meaning. Do not return error details.
	getServerBasicText : function(xhr, status, error) {
		var t = "Unknown error.";
		if (xhr.status == 0) {
			// An HTTP status code of zero in this fail mode means we could
			// not get an HTTP
			// response from the server at all, e.g. most likely a network
			// error.
			t = "Failed to contact server, connection failed."; //, error="+error+", xhr="+util.serializeToStr(xhr);
		} else {
			t = "Server call failed, server returned error code "
					+ xhr.status + " (" + xhr.statusText + "). ";
		}
		return t;
	},
	
	// Analyize a JQuery server call failure and return human readable text
	getFetchErrorText : function(response, status, error) {
		var t = "Unknown error.";
		if (response.status == 0) {
			// An HTTP status code of zero in this fail mode means we could
			// not get an HTTP
			// response from the server at all, e.g. most likely a network
			// error.
			t = "Failed to contact server, connection failed." //, error="+error+", xhr="+util.serializeToStr(xhr);
		} else {
			t = "Server call Failed, server returned error code "
					+ response.status + " (" + response.statusText + ").";
		}
		return t;
	},
	
	// TRUE if the client agent appears to be an indexing bot
	isIndexer: function() {
		var ua = navigator.userAgent;
		if (ua) {
			if (ua.includes("google.com/bot") || ua.includes("google.com/adsbot") || ua.includes("aiHitBot") || ua.includes("bingbot") || ua.includes("Daum")) {
				return true;
			}
		}
		return false;
	},
	
	// Serialize an object into a URL query string
	serializeToQuery : function(obj) {
		  var str = [];
		  for(var p in obj)
		    if (obj.hasOwnProperty(p)) {
		      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		    }
		  return str.join("&");
		},
		
	// Serialize an object into a simple NV string
	serializeToStr : function(obj) {
		  var str = [];
		  for(var p in obj)
		    if (obj.hasOwnProperty(p)) {
		      str.push(p + "=" + obj[p]);
		    }
		  return str.join("\n");
		},

	// Encapsulate some boilerplate code for common code that surrounds an
	// AJAX call. In particular this handles a delayed "loading..." status
	// indicator, setting/clearing an error field, etc.
	// uri - Server function to call
	// parms - URL parameters
	// okFunc - function called if server status is OK (args: results)
	// failFunc - function called if error (args: xhr, status, error)
	// errSelector - jQ selector for error field
	// statusSelector - jQ selector for status field
	// statusText - HTML to set on statusSelector if call takes >
	// statusDelay time (default="<img...wait> Loading...")
	// failText - HTML to set on statusSelector if call fails
	// (default="Server call failed")
	// statusDelay - ms to wait before setting status indicators
	// (default=700)

	ajaxCall : function(uri, parms, okFunc, failFunc, errSelector,
			statusSelector, statusHtml, failHtml, statusDelay) {
		if (errSelector) {
			$(errSelector).text("");
		}
		var delayedBusy = null;
		if (statusSelector) {
			delayedBusy = setTimeout(
					function() {
						$(statusSelector)
								.html(
										statusHtml ? statusHtml
												: '<img src="images/wait.gif">&nbsp;Loading...');
					}, statusDelay ? statusDelay : 700);
		}

		$.get(uri, parms, function(result) {
			if (delayedBusy)
				clearTimeout(delayedBusy); // Cancel timer, if any
			if (statusSelector) {
				$(statusSelector).html("");
			}
			if (okFunc) {
				okFunc(result);
			}
		})
				.fail(
						function(xhr, status, error) {
							if (delayedBusy)
								clearTimeout(delayedBusy); // Cancel timer,
															// if any
							if (statusSelector) {
								$(statusSelector).html(
										failHtml ? failHtml
												: "Server call failed");
							}
							$(errSelector).text(
									util.getServerErrorText(xhr, status,
											error));
							if (failFunc) {
								failFunc(xhr, status, error);
							}
						});

	},
	

	// Makes a POST call with the 'data' in the body of the request (stringified)

	ajaxCallPostData: function(uri, data, okFunc, failFunc, errSelector, statusSelector, statusHtml, failHtml, statusDelay) {
		if (errSelector) {
			$(errSelector).text("");
		}
		var delayedBusy = null;
		if (statusSelector) {
			delayedBusy = setTimeout(function() {
				$(statusSelector).html(statusHtml ? statusHtml : '<img src="images/wait.gif">&nbsp;Loading...');
			}, statusDelay ? statusDelay: 700);
		}
		
		
		$.ajax({
		    url: uri,
		    type: "POST",
		    data: data,
		    contentType: "application/x-www-form-urlencoded; charset=utf-8",
		    success: function(result, status, xhr) {
				if (delayedBusy) clearTimeout(delayedBusy); // Cancel timer, if any
				if (statusSelector) {
					$(statusSelector).html("");
				}
				if (okFunc) {
					okFunc(result, status, xhr);
				}
		    },
		    error: function(xhr, status, error) {
				if (delayedBusy) clearTimeout(delayedBusy); // Cancel timer, if any
				if (statusSelector) {
					$(statusSelector).html(failHtml ? failHtml: "Server call failed");
				}
				$(errSelector).text(util.getServerErrorText(xhr, status, error));
				if (failFunc) {
					failFunc(xhr, status, error);
				}
		    }
		});	
		
	},
	
	/**
	 * Encapsulates a GET fetch() call with a Promise that resolves to the response JSON object and
	 * rejects both on network errors and HTTP status >299 errors. This removes a layer of promise
	 * chaining and HTTP status checking from calls to the server, and unifies error handling into
	 * the promise reject().
	 * TODO: Combine with common code in promiseCallPostJson().
	 */
	promiseCallGetJson: function(uri) {
		return new Promise(function(resolve, reject) {
			fetch(uri
			).catch(function(err) {
				reject(err);
			}).then(function(response) {
				// Check HTTP status, fetch() does not throw on non-200 codes
				if (!response.ok) {
					// Full error text from body is available only as an async promise from response.text() method.
					response.text().then(function(t) {
						reject(Error(response.statusText+": "+ t));
					});
				}
				else {
					// Http status OK, get the JSON body (async) and make it the result of this promise
					resolve(response.json());
				}
			});
		});
	},
	
	promiseCallGetJsonBasicAuth: function(uri, id, pw) {
		const reqHeaders = new Headers();
		reqHeaders.set("Authorization", "Basic "+btoa(id+":"+pw));
		
		return new Promise(function(resolve, reject) {
			fetch(uri, {headers: reqHeaders}
			).catch(function(err) {
				reject(err);
			}).then(function(response) {
				// Check HTTP status, fetch() does not throw on non-200 codes
				if (!response.ok) {
					// Full error text from body is available only as an async promise from response.text() method.
					response.text().then(function(t) {
						reject(Error(response.status+": "+ t));
					});
				}
				else {
					// Http status OK, get the JSON body (async) and make it the result of this promise
					resolve(response.json());
				}
			});
		});
	},
	
	
	/**
	 * Encapsulates a POST fetch() call with a Promise that resolves to the response JSON object and
	 * rejects both on network errors and HTTP status >299 errors. This removes a layer of promise
	 * chaining and HTTP status checking from calls to the server, and unifies error handling into
	 * the promise reject().
	 */
	promiseCallPostJson: function(uri, data) {
		return new Promise(function(resolve, reject) {
			fetch(uri, {
				method: "POST",
				headers: {
					'Content-Type': 'application/json'
				},				
				body: JSON.stringify(data)
			}).catch(function(err) {
				// fetch() only rejects on network errors, not HTTP status codes.
				// The "err" object is a TypeError (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError)
				reject(Error("Failed to contact CTG server."));
			}).then(function(response) {
				// Check HTTP status, fetch() does not throw on non-200 codes
				if (!response.ok) {
					// Full error text from body is available only as an async promise from response.text() method.
					response.text().then(function(t) {
						reject(Error(response.status+": "+response.statusText+": "+ t));
					});
				}
				else {
					// Http status OK, get the JSON body (async) and make it the result of this promise
					resolve(response.json());
				}
			});
		});
	},
	
	/**
	 * Returns the jQuery jqXHR object which implements the Promise interface.
	 */
	ajaxCallPostJson: function(uri, data, okFunc, failFunc, errSelector, statusSelector, statusHtml, failHtml, statusDelay) {
		if (errSelector) {
			$(errSelector).text("");
		}
		var delayedBusy = null;
		if (statusSelector) {
			delayedBusy = setTimeout(function() {
				$(statusSelector).html(statusHtml ? statusHtml : '<img src="images/wait.gif">&nbsp;Loading...');
			}, statusDelay ? statusDelay: 700);
		}
		
		
		return $.ajax({
		    url: uri,
		    type: "POST",
		    data: JSON.stringify(data),
		    contentType: "application/json",
		    success: function(result) {
				if (delayedBusy) clearTimeout(delayedBusy); // Cancel timer, if any
				if (statusSelector) {
					$(statusSelector).html("");
				}
				if (okFunc) {
					okFunc(result);
				}
		    },
		    error: function(xhr, status, error) {
				if (delayedBusy) clearTimeout(delayedBusy); // Cancel timer, if any
				if (statusSelector) {
					$(statusSelector).html(failHtml ? failHtml: "Server call failed");
				}
				$(errSelector).text(util.getServerErrorText(xhr, status, error));
				if (failFunc) {
					failFunc(xhr, status, error);
				}
		    }
		});	
		
	},

	serverCall: function(
			uri, // URL to call 
			parms, // URL parameters, encoded
			okFunc, // Function to call if HTTP status=200
			failFunc, // Function to call if status<>200
			jQspinner, // jQuery selector for spinner (wait icon), if any
			jQerrorDiv, // jQuery selector for error div (or any element)
			jQerrorTxt // jquery selector for error text field
			) {
		if (jQerrorTxt) {
			$(jQerrorTxt).text("");
		}
		if (jQerrorDiv) {
			$(jQerrorDiv).hide();
		}
		if (jQspinner) {
			$(jQspinner).show();
		}

		$.get(uri, parms, function(result) {
			if (jQspinner) {
				$(jQspinner).hide();
			}
			if (okFunc) {
				// Make OK callback
				okFunc(result);
			}
		})
		.fail(
			function(xhr, status, error) {
				if (jQspinner) {
					$(jQspinner).hide();
				}
				if (jQerrorTxt) {
					$(jQerrorTxt).text(util.getServerErrorText(xhr, status,	error));
				}
				if (jQerrorDiv) {
					$(jQerrorDiv).show();
				}
				if (failFunc) {
					failFunc(xhr, status, error);
				}
			});

	},
	
	//v4.48 Generated by Google ads console for conversion tracking. gtag() function is defined
	// in index.html
	gtag_report_buy_conversion: function (numericValue, url) {
		  var callback = function () {
		    if (typeof(url) != 'undefined') {
		      window.location = url;
		    }
		  };
		  gtag('event', 'conversion', 
			{
		      'send_to': 'AW-977796578/giowCJnDx50BEOL7n9ID',
		      'value': numericValue,
		      'currency': 'USD',
		      'transaction_id': '',
		      'event_callback': callback
			});
		  return false;
		},
	
	/**
	 * Kicks off an async call to the server to report a Javascript error. The details may contain
	 * HTML markup. An email is sent to the server admin with the supplied details.
	 */
	reportJSError: function(details) {
		if (typeof details == "object") {
			details = JSON.stringify(details);
		}
		console.log("Reporting to Cabintech admin: "+details);
		util.ajaxCall("ReportJSError", "details=" + encodeURIComponent(details) + "&agent=" + encodeURIComponent(navigator.userAgent) + "&version="+VERSION);
	},
	
	/**
	 * Kicks off an async call to the server to report a Javascript event. The details may contain
	 * HTML markup. An email is sent to the server admin with the supplied details.
	 */
	reportJSEvent: function(type, amount, subject, details, logOnly) {
		var logOnly = logOnly===true ? true : false; //v7.56
		if (typeof details == "object") {
			details = JSON.stringify(details);
		}
			
		util.ajaxCall("ReportJSEvent", "details=" + encodeURIComponent(details) + "&subject=" + encodeURIComponent(subject) + "&agent=" + encodeURIComponent(navigator.userAgent) + "&type=" + encodeURIComponent(type) + "&amount=" + encodeURIComponent(amount) + "&logonly=" + logOnly);
	},

	/**
	 * Kicks off an async call to the server to report to the site admin. Any failure is ignored.
	 */
	reportToAdmin: function(subject, details) {
		util.ajaxCall("ReportToAdmin", "details=" + encodeURIComponent(details) + "&subject=" + encodeURIComponent(subject));
	},

	// Returns TRUE if the value is null or an empty string
	isEmpty : function(value) {
		return (value == null || value === "");
	},

	/*
	 * Creates a dialog from the element (panelId) supplied and displays
	 * it modally.
	 * 
	 * One of the 2 callbacks will be called when the dialog is dismissed.
	 * If the callback returns TRUE then the dialog remains open after the
	 * callback completes, otherwise it is closed.
	 * 
	 * Note that this is a modal dialog, but is not synchronous. Control
	 * will return to the caller immediately, and the callback will be
	 * called when a button is clicked.
	 * 
	 * See also convenience functions alertBox() and infoBox()
	 * 
	 */
	dlgBox : function(title, panelId, okFunction, cancelFunction) {
		if (!title) {
			title = "Message";
		}
		
	    var buttons = [
	    	{
	        text: "OK",
	        click: function() {
	        	// If caller supplied a function, call it. If it returns false
	        	// then close the dialog, otherwise it is left open.
				if (okFunction) {
					if (!okFunction()) $(this).dialog("close");
				}
				else {
					$(this).dialog("close");
				}
	        },
	        id: 'dialog_ok_button'
	    },
    	{
	        text: "Cancel",
	        click: function() {
	        	// If caller supplied a function, call it. If it returns false
	        	// then close the dialog, otherwise it is left open.
				if (cancelFunction) {
					if (!cancelFunction()) $(this).dialog("close");
				}
				else {
					$(this).dialog("close");
				}
	        },
	        id: 'dialog_cancel_button'
    	}
	    ]


		$(panelId).dialog({
			autoOpen : true,
			width:'auto',
			title : title,
			buttons : buttons,
			modal : true,
//			open: function() {
//				$(this).data("action", ""); // Clear any old action
//			},
//			close : function() {
//				var action = $(this).data("action");
//				if ((action) && (action=="ok")) {
//					if (okFunction) okFunction();
//				}
//				else {
//					if (cancelFunction) cancelFunction();
//				}
//			}
		});

	},
	
	dlgBox2 : function(title, panelId, okFunction, cancelFunction, buttons) {
		if (!title) {
			title = "Message";
		}
		if (!buttons) buttons = {
			"OK" : function() {
				$(this).data("action", "ok"); // Note OK button was used
				$(this).dialog("close");
			},
			"Cancel" : function() {
				$(this).data("action", "cancel"); // Note cancel button was used
				$(this).dialog("close");
			}
		};

		$(panelId).dialog("option", {
			//autoOpen : true,
			//width:'auto',
			title : title,
			buttons : buttons,
			//modal : true,
			open: function() {
				$(this).data("action", ""); // Clear any old action
			},
			close : function() {
				var action = $(this).data("action");
				if ((action) && (action=="ok")) {
					if (okFunction) okFunction();
				}
				else {
					if (cancelFunction) cancelFunction();
				}
			}
		});
		
		$(panelId).dialog("open");


	},
	
	msgBox : function(title, message, image, buttons, width, closeFunction) {
		if (!title) {
			title = "Message";
		}
		if (!message) {
			message = "";
		}
		if (!buttons) {
			buttons = {
				"OK" : function() {
					$(this).dialog("close");
				}
			};
		}
		// Dynamically build up HTML/DOM objects for the dialog
		var s = [];
		s.push("<table style='margin-top:10px;margin-left:5px;margin-right:5px;' class='msgbox'><tr>");
		var maxwidth = width ? width : 440;
		if (image) {
			s.push("<td><img src='" + image + "'></td>");
			maxwidth = maxwidth - 80; // Need room for image
		}
		s.push("<td><div style='margin-left:10px;margin-right:10px;'>");
		s.push(message);
		s.push("</td></table>");

		$(s.join("")).dialog({
			autoOpen : true,
			title : title,
			buttons : buttons,
			width : maxwidth + 20,
			modal : true,
			close : function() {
				if (closeFunction) {
					closeFunction();
				}
				$(this).remove(); // Remove dynamic content when dialog is
									// closed
			}
		});

	},

	alertBox : function(title, message, imagePathPrefix, closeCallback) {
		if (!imagePathPrefix) imagePathPrefix = "";
		util.msgBox(title, message, imagePathPrefix+"images/alert.jpg", null, null, closeCallback);
	},

	infoBox : function(title, message, imagePathPrefix) {
		if (!imagePathPrefix) imagePathPrefix = "";
		util.msgBox(title, message, imagePathPrefix+"images/info.png");
	},
	
	confirmBox: function(title, message, okFunction, cancelFunction, imagePathPrefix) {
		if (!imagePathPrefix) imagePathPrefix = "";

		if (!title) {
			title = "Confirm";
		}
		if (!message) {
			message = "Please confirm.";
		}
		var	buttons = [
		   	           {text: "Cancel",
			   	        	click: function() {
		  	        	   		if (cancelFunction) cancelFunction();
		  	        	   		$(this).dialog("close");
			   	            }
			   	       },
		   	           {text: "OK",
			   	    	   click: function() {
	   	        	   			if (okFunction) okFunction();
	   	        	   			$(this).dialog("close");
			   	    	   }
		   	           }
		   	          ];
		// Dynamically build up HTML/DOM objects for the dialog
		var s = [];
		s.push("<table style='margin-top:10px;margin-left:5px;margin-right:5px;' class='msgbox'><tr>");
		var maxwidth = 440;
//		if (util.isMobile()) { /*V1.3.0 Keep dialog in bounds on mobile */
//			maxwidth = util.getScreenWidth() - 40;
//		}
//		maxwidth = width ? width : maxwidth;
		s.push("<td><img src='"+imagePathPrefix+"images/alert.jpg'></td>");
		maxwidth = maxwidth - 80; // Need room for image 
		s.push("<td><div style='margin-left:10px;margin-right:10px;'>");
		s.push(message);
		s.push("</td></table>");
		
		$(s.join("")).dialog({
			autoOpen: true,
			title: title,
			buttons: buttons,
			width: maxwidth+20,
			modal: true,
			close: function() {
				$(this).remove(); // Remove dynamic content when dialog is closed
			}
		});
		
	},


	/**
	 * Hides or shows the given UI object(s) based on the boolean value 
	 * (true=show, false=hide). The first arg can be a jQuery selector
	 * string (e.g. ".myclass > table") or a jQuery object e.g. $(".myclass > table").
	 * 
	 * Kind of dumb jQuery does not have a boolean hide/show method,
	 * requiring the use of an if/then/else to show an object based on a boolean value. 
	 */
	show : function(selectorOrJQuery, showIt) {
		if (typeof selectorOrJQuery == "string") {
			selectorOrJQuery = $(selectorOrJQuery); // Evaluate selector to get (set of) jQuery objects
		}
		if (showIt) {
			selectorOrJQuery.show();
		} else {
			selectorOrJQuery.hide();
		}
	},

	// Returns the given string, or "" if the reference is NULL.
	safeStr : function(str) {
		return str ? str : "";
	},

	// A strict pattern string replacement without regard to regex special
	// characters
	replaceAll : function(str, pattern, replaceWith) {
		return str.split(pattern).join(replaceWith);
	},

	// Trim each element of the given array of strings
	trimArrayElements : function(arr) {
		for (var i = 0; i < arr.length; i++) {
			arr[i] = arr[i].trim();
		}
	},

	// Returns TRUE if the given object is of the given type
	isType : function(obj, type) {
		var clas = Object.prototype.toString.call(obj).slice(8, -1);
		return obj !== undefined && obj !== null && clas === type;
	},
	
	// Returns TRUE IFF the arg is a string that is a valid number (integer or float)
	// See https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number
	isNumeric: function(str) {
		return !isNaN(str) && !isNaN(parseFloat(str)) 
	},

	// Returns the string value formatted into 2-decimal places USD notation
	// with leading "$" (string)
	formatUSD : function(val) {
		if (val == null || val === "") {
			return ""; // Not a valid dollar amount
		}
		return "$" + parseFloat(val, 2).toFixed(2);
	},
	
	// Returns the string value formatted into 2-decimal places USD notation
	// without any leading "$". If val is a number, a string representation is
	// returned with 2 decimal places.
	formatUS : function(val) {
		if (val == null || val === "") {
			return ""; // Not a valid dollar amount
		}
		if (typeof val == "string")	return parseFloat(val, 2).toFixed(2);
		if (typeof val == "number") return val.toFixed(2);
		return "";
	},

	/**
	 * Given an arbitrary string, return a string that is safe to use
	 * in $().html(x) without danger of HTML or script injection or
	 * misinterpratation.
	 * 
	 * Null is returned as an empty string.
	 */
	htmlEscape: function  (string) {
		if (!string) return ""; // Map null to empty string
		
	  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
		    return util.htmlEntityMap[s];
		  });
		},
		
	/**
	 * Returns a human readable description of the discounts applied
	 * to this order, e.g. "5% + $25.10". Returns "none" if there is no discount.
	 * Useful in building email templates. Same algorithm as the server
	 * Util.getDiscountDesc().
	 * 
	 */
	getDiscountDesc: function(order) {
		var disc = +util.safeStr(order[ORDER_DISCOUNT]);
		if (disc != 0.0) {
    		// There is a discount
			var discPct = +util.safeStr(order[ORDER_DISCOUNTPCT]);
			var discVal = +util.safeStr(order[ORDER_DISCOUNTVAL]);
			var msg = []
			
			if (discPct != 0.0) {
				msg.push(discPct + "% ");
			}
			if (discVal != 0.0) {
				msg.push(util.formatUSD(discVal));
			}
			if (msg.length == 0) msg.push("none");
			
			return msg.join(" + ");
			
		}
		return "none";
	},
	
	/**
	 * Return a numeric amount due for the given order. If the payment status is 'Complete'
	 * then zero is returned no matter the order total or specified amount due on the order.
	 * Otherwise returns the ORDER_AMOUNT_DUE, or if that is missing/zero, then the
	 * ORDER_TOTAL.
	 */
	getAmountDue(order) {
		if (order[ORDER_PAYMENT_STATUS] == PAYMENT_STATUS_COMPLETE || order[ORDER_STATUS]==ORDER_STATUS_CANCELLED || order[ORDER_STATUS]==ORDER_STATUS_PENDING_CANCEL) {
			return 0.0; // By defn, if payment is complete or order is cancelled, no amount is due
		}
		let amtDue = util.safeStr(order[ORDER_AMOUNT_DUE]);
		if (amtDue=="" || amtDue==0) {
			amtDue = order[ORDER_TOTAL];
		}		
		return parseFloat(amtDue);
	},

	
	/**
	 * Clears all input elements under the given root UI element (jquery selector
	 * string).
	 * @param root
	 * @returns
	 */
	clearUIElements: function(root) {
		$(root+' input[type="text"]').val(""); // All text inputs 
		$(root+' input:not([type])').val(""); // All text inputs (default, no type specified)
		$(root+' input[type="number"]').val(""); 
		$(root+' input[type="date"]').val(""); 
		$(root+' textarea').val(""); // All textarea inputs
		$(root+' select').prop('selectedIndex', 0); // All droplists set to first option
		$(root+' input[type="checkbox"]').prop("checked", false); // All checks off
	},
	

	/**
	 * Displays a modal 'wait...' dialog until waitDialogClose() is called.
	 */
	waitDialogOpen: function(title, msg) {
		$("#wait-dlg-msg").text(msg ? msg : "Please wait...");
		$("#wait-dlg").dialog({
			title: title ? title : "Wait",
			modal: true
		});
		$("#wait-dlg").dialog("open");
	},

	/**
	 * Close a dialog opened by waitDialogOpen(). Has no effect if the wait dialog
	 * is not open at the time of this call.
	 */
	waitDialogClose: function() {
		$("#wait-dlg").dialog("close");
	},
	
	/**
	 * Returns the carrier-specific URL to display tracking information about a specific
	 * shipment.
	 * 
	 * See java Util.getTrackingURL()
	 */
	getTrackingURL: function(carrier, trackingId) {
		carrier = util.safeStr(carrier);
		trackingId = util.safeStr(trackingId);
		var carrierURL = SHIP_CARRIER_TRACK_URL_MAP[carrier];
		if (!carrierURL) return "http://"+trackingId;  // Not great solution, but best we can do if we don't recognize the carrier
		return util.replaceAll(carrierURL, "%trackid%", trackingId);
	},
	
	/**
	 * Returns the named parameter from the given query parm string (e.g. "?a=b&c=d"). If
	 * no qParms is supplied, they are taken from the current window.location.
	 */
	getParameterByName: function(name, qParms) {
		let qp = qParms ? qParms : window.location.search;
		
		let match = RegExp('[?&]' + name + '=([^&]*)').exec(qp);
		return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
	},
	
	/**
	 * Standard HTML telling user we know about a website problem.
	 */
	adminNotifiedHtml: function() {
		return 'Our website administrator has been notified of the problem. If you need help please <a href="contact">contact us</a>.'
	},
	
	
	/**
	 * Builds a simple HTML text string with <br> line breaks for an address object.
	 * @param addr
	 * @returns
	 */
	buildAddrHtml: function(addr) {
		if (!addr) return "";
		
		var s = [];
		s.push(util.isEmpty(addr[ADDR_NAME]) ? "" : util.htmlEscape(addr[ADDR_NAME])+"<br>"); 
		s.push(util.isEmpty(addr[ADDR_COMPANY]) ? "" : util.htmlEscape(addr[ADDR_COMPANY])+"<br>"); 
		s.push(util.isEmpty(addr[ADDR_STREET]) ? "" : util.htmlEscape(addr[ADDR_STREET])+"<br>"); 
		s.push(util.isEmpty(addr[ADDR_STREET2]) ? "" : util.htmlEscape(addr[ADDR_STREET2])+"<br>"); 
		s.push(util.htmlEscape(addr[ADDR_CITY])+" "); 
		s.push(util.htmlEscape(addr[ADDR_STATE])+" "); 
		s.push(util.htmlEscape(addr[ADDR_ZIP])+"<br>");
		s.push(util.htmlEscape(addr[ADDR_COUNTRYCODE])+" (");
		s.push(util.htmlEscape(util.countryCodeToName(addr[ADDR_COUNTRYCODE]))+")");
		if (!util.isEmpty(addr[ADDR_PHONE])) {
			s.push("<br>Phone "+util.htmlEscape(addr[ADDR_PHONE]));
		}
		return s.join("");
	},
	
	/**
	 * Given a 2-letter ISO country code, returns the (short) country name in English.
	 * @param countryCode
	 * @returns
	 */
	countryCodeToName: function(countryCode) {
		if (!countryCode) return "";
		
		// Server supplied the country code list from Constants.java.
		if (COUNTRY_CODE_MAP[countryCode]) {
			return COUNTRY_CODE_MAP[countryCode]; 
		}
		return countryCode; // PUNT!
	},	
	
	/**
	 * Returns a case-corrected copy of the given SKU. In general SKUs are
	 * all upper case, except for a few special cases. This method will return
	 * the sku such that it can be compared to product SKUs verbatium.
	 */
	toSkuCase: function(sku) {
		if (!sku) return;
		sku = sku.toUpperCase();
		if (sku.endsWith("XV")) { // Why oh why did we use lower case only for Xvive devices?
			sku = sku.replace("XV", "xv");
		}
		return sku;
	},
	
//OBSOLETE	
//	/**
//	 * All product data blocks inside the given JQuery container will be initialized
//	 * with data from the product list (e.g. price, availability, etc). This needs to be
//	 * done only once per load of a page containing product data blocks. Each data block
//	 * is found by having a class name of "product" and a data tag named "sku" whose value
//	 * is the product SKU, e.g.
//	 * 
//	 * <div class="product" data-sku="V2164D">
//	 * ...
//	 * </div>
//	 * 
//	 * This init is required for the shopping cart to operate. The container may contain 
//	 * any number of product data blocks.
//	 * 
//	 * If there is any failure, the content of the data block is replaced with an error message.
//	 */
//	initProductFields: function(container) {
//		$(container).find(".product").each(function() {
//			// For each product div
//			var prodUI = $(this);
//			var sku = prodUI.data('sku');
//			if (!sku) {
//				prodUI.html('<span class="err-msg">Web site error: Did not find data-sku tag.</span>');
//				return;
//			}
//			
//			sku = util.toSkuCase(sku); // Insure upper/lower case is correct for SKU lookup
//			
//			// Find product data in global product map
//			var prodData = prodList[sku];
//			if (!prodData) {
//				prodUI.html('<span class="err-msg">Web site error: Did not find product data for SKU: '+sku+'.</span>');
//				return;
//			}
//			
//			// Trap any JS errors so we are sure everything is populated correctly
//			try {
//				prodUI.find(".item_add").button(); // Init button UI
//	
//				// Populate UI elements with product details
//				prodUI.find(".item_code").text(sku);
//				prodUI.find(".item_weight").text(prodData.Weight);
//				prodUI.find(".item_price").text(prodData.WebPrice);
//	
//				// Build prod name for the cart from bits and peices
//				var preOrderPrefix = ""; // Add prefix to item description if this is a preorder item
//				if (prodData.PreorderingFor != "") {
//					preOrderPrefix = "PRE-ORDER ";
//				}
//				var	circuitPkg = " (" + prodData.Pkg + ")";
//				prodUI.find(".item_name").text(preOrderPrefix + prodData.Vendor + " " + prodData.Code + " "	+ prodData.LongDesc + circuitPkg);
//				
//				// Low stock processing
//				var stock = prodData.Stock;
//				var stockNote = "";
//				if (prodData.WebSO.length > 0) { // Stock override
//					stock = prodData.WebSO;
//				}
//				if (stock > 0) { // We have stock for ordering
//					var trigger = parseInt(prodData.LowStockTrigger);
//					var lowStockType = 'in stock';
//					if (prodData.PreorderingFor != "") {
//						// We have a preorder in progress, display prominant notice and fill in expected ship date
//						stockNote = 'This item is out of stock but may be pre-ordered now. Expected restock date is '+prodData.PreorderingFor+'. Placing an order for this item will guarantee-reserve stock and shipment within 24 hours of '+
//							'vendor delivery. You will be charged at the time of placing your order. You may cancel and request a full refund any time before shipment. Please read '+ 
//							'our <a href="https://cabintechglobal.com/preorder-policy.html" target="_blank">Presale Policy</a> before placing your order. ';
//						lowStockType = 'for pre-ordering';
//					}
//					if (stock < trigger) {
//						// Low stock warning
//						stockNote = stockNote + 'Only '+stock+' units left '+lowStockType;
//					}
//				}
//				else { // Out of stock
//					prodUI.find(".item_add").button("disable");
//					var subject = encodeURIComponent('Expected restock date for '+sku);
//					stockNote = 'OUT OF STOCK. <a target="_blank" href="mailto:sales@cabintechglobal.com?subject='+ subject + '">Contact us</a> for expected restock date.';
//					prodUI.find(".stock-note").css('display','inline-block');
//				}
//				
//				if (stockNote.length > 0) {
//					prodUI.find(".stock-note").html(stockNote);
//					prodUI.find(".stock-note").show();
//				}
//				
//				// Hide spinner and display product data
//				prodUI.find(".prod-wait").hide();
//				prodUI.find(".prod-cart-data").css('display','inline-block');
//			}
//			catch (jsError) {
//				prodUI.html('<span class="err-msg">Web site error: Failed to init product cart data for SKU='+sku+'. ('+jsError+'</span>');
//				return;
//			}
//		
//		});
//	},
	
	initProductTab: function(tabPanel) {
		// If this tab HTML is directly loaded, redirect to load with the full site. Search
		// engines will often return links to the individual product pages that dont work
		// for the user stand-alone (e.g. the shopping cart is not defined).
		//OBSOLETE?
		//if (typeof(simpleCart) != "function") {
		//	window.location = tabPanel.data("tabname") // e.g. "cefx-vco";
		//}
		
		// For each DIV on the panel of class 'product-cart', load the product data into the
		// controls inside that div.
		$(".product-cart").each(function() {
			util.buildProductCart($(this));
		});
		
		// Facebook buttons behave badly, have to load them async
		//OBSOLETE
		//setTimeout(function() {
		//	buildFBButtons(tabPanel);
		//}, 500);

		// A crude and simplistic way to prevent bots from pickup our our address and
		// phone numbers by scraping HTML pages.
		var s='<A HREF="ma';
		s = s + 'ilto:';
		s = s + getSalesEM();
		s = s + '">';
		s = s + getSalesEM();
		s = s + '</A>';
		var a = '<A HREF="ma';
		a = a + 'ilto:';
		a = a + getAdminEM();
		a = a + '">';
		a = a + getAdminEM();
		a = a + '</A>';
		var f='81';
		f = f + '5-84';
		f = f + '6-753';
		f = f + '2';
		// Put this into any page that needs it
		tabPanel.find(".sales_adr").html(s);
		tabPanel.find(".admin_adr").html(a);
		tabPanel.find(".fax_num").html(f);

		// Locate product data //TODO: Already did this in buildProductCart() above, consolidate/refactor this
		
		var sku = tabPanel.find(".product-cart").data('sku');
		if (!sku) return;
		sku = util.toSkuCase(sku);
		
		// Build any product compatibility lists (there may be more than 1 in a product panel) //v8.02
		util.buildProductTableDivs(tabPanel, prodList[sku]);
	},
	
	/**
	 * Look for elements in the jqUI DOM tree with class names of "compat-list" and
	 * "related-list". Insert an HTML table into those elements with the compatibility
	 * or related product list for the given product (prodData).
	 */
	buildProductTableDivs: function(jqUi, prodData) {
		if (!prodData) return; //v9.48
		var sku = prodData[PROD_SKU];
		// Build any product compatibility lists (there may be more than 1 in a product panel) //v8.02
		jqUi.find(".compat-list").each(function() { 
			var compatible = prodData[PROD_COMPAT_LIST];
			var tableHTML = util.buildLinkedProductTable(compatible, sku);
			if (tableHTML != "") $(this).append('<h2>Compatible<span onclick="util.showCompatibilityNotice();return false;" class="link-style-simple">*</span> Replacement Parts</h2>'+tableHTML);
		});

		// Build any product compatibility lists (there may be more than 1 in a product panel) //v8.02
		jqUi.find(".related-list").each(function() { 
			var related = prodData[PROD_RELATED_LIST];
			// Special case, dynamically build related SKUs for DIL conversion boards
			if (sku == "SOPDIL16") {
				var allSkus = Object.getOwnPropertyNames(prodList);
				for (var i=0; i<allSkus.length; i++) {
					switch (prodList[allSkus[i]][PROD_PKG]) {
						case 'SOIC-8':
						case 'SOIC-10':
						case 'SOIC-14':
						case 'SOIC-16':
							related = related + "," + prodList[allSkus[i]][PROD_SKU];
							break;
					}
				}
			}
			else if (sku == "SOPWDIL28") {
				var allSkus = Object.getOwnPropertyNames(prodList);
				for (var i=0; i<allSkus.length; i++) {
					switch (prodList[allSkus[i]][PROD_PKG]) {
					case 'SOP-16W':
					case 'SOP-18W':
					case 'SOP-20W':
					case 'SOP-24W':
					case 'SOP-28W':
							related = related + "," + prodList[allSkus[i]][PROD_SKU];
							break;
					}
				}
			}
			else {
				// Special case, add DIL converters to all products they work with
				switch (prodData[PROD_PKG]) {
					case 'SOIC-8':
					case 'SOIC-10':
					case 'SOIC-14':
					case 'SOIC-16':
						related = related + ",SOPDIL16";
						break;
					case 'SOP-16W':
					case 'SOP-18W':
					case 'SOP-20W':
					case 'SOP-24W':
					case 'SOP-28W':
						related = related + ",SOPWDIL28"
						break;
						
				}
			}
			var tableHTML = util.buildLinkedProductTable(related, sku);
			if (tableHTML != "") $(this).append('<h2>Related Products</h2>'+tableHTML);
		});
		
	},
	
	buildVendorProductTable: function(vendorName, style) {
		// Build list of data objects we need to construct the table, then we can sort
		// before building it.
		let h = []; // HTML
		let dataList = [];
		let skuList = Object.keys(prodList);
		for (let i=0; i<skuList.length; i++) {
			let prodInfo = prodList[skuList[i]];
			if (prodInfo) {
				if (prodInfo[PROD_MFG]==vendorName) {
					dataList.push({
						'sku': prodInfo[PROD_SKU],
						'desc': prodInfo[PROD_DESC],
						'pkg': prodInfo[PROD_PKG],
						'mfg': prodInfo[PROD_MFG]
					});
				}
			}
		}
		dataList.sort(function(a,b) {
			return a.sku.localeCompare(b.sku); // Sort by SKU so they are not just in random order
		});
		
		// Construc the HTML table
		if (dataList.length > 0) {
			h.push('<table style="'+style+'" class="basic-table compact-table related-table"><thead><tr><th>SKU</th><th>Product</th><th>Pkg</th></tr></thead><body>'); 
			for (var i=0; i<dataList.length; i++) {
				h.push('\n<tr><td><a href="" onclick="return gotoProduct(\''+dataList[i].sku+'\');">'+dataList[i].sku+'</a>');
				h.push("</td><td>"+dataList[i].desc);
				h.push("</td><td>"+dataList[i].pkg);
				h.push("</td></tr>");
			}
			h.push('</tbody></table>');
		}
		
		return h.join(''); // Return full HTML of the table (or empty string)
		
	},
	
	buildLinkedProductTable: function(groupSkuListCSV, sku, relationType) {
		var h = [];
		if (groupSkuListCSV) {
			list = groupSkuListCSV.split(",");          // Convert CSV into array, each element is either a SKU, or "group:XXX"
			list = util.expandProductGroups(list, sku); // Expand groups, remove dups, eliminate this SKU. Now these are all SKUs
			
			//V9.06 Build list of data objects we need to construct the table, then we can sort
			// before building it.
			let dataList = [];
			for (var i=0; i<list.length; i++) {
				var prodInfo = prodList[list[i]];
				if (prodInfo) {
					//console.log(prodInfo[PROD_DESC]+"."+prodInfo[PROD_PKG]+","+prodInfo[PROD_MFG])
					dataList.push({
						'sku': prodInfo[PROD_SKU],
						'desc': prodInfo[PROD_DESC],
						'pkg': prodInfo[PROD_PKG],
						'mfg': prodInfo[PROD_MFG]
					});
				}
			}
			dataList.sort(function(a,b) {
				if (a.mfg==MFG_SSI) return -1;
				if (b.mfg==MFG_SSI) return 1;
				return a.mfg.localeCompare(b.mfg);
			});
			
			// Construc the HTML table
			if (dataList.length > 0) {
				h.push('<table class="basic-table compact-table related-table"><thead><tr><th>SKU</th><th>Product</th><th>Pkg</th><th>Mfg</th></tr></thead><body>'); 
				for (var i=0; i<dataList.length; i++) {
					h.push('<tr><td><a href="'+dataList[i].sku+'" onclick="event.preventDefault();return gotoProduct(\''+dataList[i].sku+'\');">'+dataList[i].sku+'</a>');
					h.push('</td><td>'+dataList[i].desc);
					h.push("</td><td>"+dataList[i].pkg);
					h.push("</td><td>"+dataList[i].mfg);
					h.push("</td></tr>");
				}
				h.push('</tbody></table>');
			}
		}
		//console.log(h.join(''));
		return h.join(''); // Return full HTML of the table (or empty string)
	},
	
	/**
	 * Given an array of group and/or SKUs, returns a new array
	 * that expands the groups into their respective SKUs. It also
	 * removes any duplicate SKUs and will remove the 'excludeSku'
	 * if it is in the resulting list.
	 */
	expandProductGroups: function(groupList, excludeSku) {
		if (!groupList) return [];
		var seen = {};
		for (var i=0; i<groupList.length; i++) {
			if (groupList[i].startsWith("group:")) {
				var gName = groupList[i].substring(6);
				// Add group content if the group exists
				if (groupMap[gName]) {
					for (j=0; j<groupMap[gName].members.length; j++) {
						seen[groupMap[gName].members[j]] = true; // Add to list of SKUs we have seen
					}
				}
				else {
					util.reportJSError("Product group '"+gName+"' referenced by SKU '"+excludeSku+"' was not found.")
				}
			}
			else {
				// Single SKU
				seen[groupList[i]] = true;
			}
		}
		
		delete seen[excludeSku]; // Remove exclusion if it exists
		return Object.keys(seen);// Array of property names (SKUs)
	},
	
	showCompatibilityNotice: function() {
		util.msgBox("Compatibility Note","Products listed in the <i>Compatible</i> table have the same circuit functionality as this product.<p> However they may have some variation in electrical characteristics - check datasheets to verify compatibility in your circuit design.<p>Some may also have different physical packaging requiring adapters or PCB design changes.")
	},
	
	/**
	 * Build product cart DIV given jquery DIV object
	 */
	buildProductCart: function(pcDiv) {
		var sku = pcDiv.data('sku');
		if (!sku) {
			pcDiv.html('<span class="err-msg">Web site error: Did not find product SKU data tag.</span>');
			return;
		}
		sku = util.toSkuCase(sku);
		
		// Find product data in global product map
		var prodData = prodList[sku];
		if (!prodData) {
			pcDiv.html('<span class="err-msg">Web site error: Did not find product data for SKU: '+sku+'. This error has been reported to our site administrator and will be fixed soon.</span>');
			util.reportJSError("ctg.util.buildProductCart() did not find product data for SKU: "+sku);
			return;
		}
		
		var priceLevels = prodData[PRICE_LEVELS];
		if (!priceLevels || priceLevels.length == 0) {
			pcDiv.html('<span class="err-msg">Web site error: Did not find pricing data for SKU: '+sku+'. This error has been reported to our site administrator and will be fixed soon.</span>');
			util.reportJSError("ctg.util.buildProductCart() did not find pricing data in the product structure for SKU: "+sku);
			return;
		}
		
		// Build prod name for the cart from bits and peices
		var preOrderPrefix = ""; // Add prefix to item description if this is a preorder item
		if (prodData[PROD_PRESALE] == "true") {
			preOrderPrefix = PREORDER_PREFIX+" ";
		}
		var	prodPkg = prodData[PROD_PKG];
		var prodName = preOrderPrefix + prodData[PROD_MFG] + " " + prodData[PROD_SKU] + " "	+ prodData[PROD_DESC];
		
		// Low stock processing
		var stock = prodData[PROD_AVAILABLE];
		//if (prodData.WebSO.length > 0) { // Stock override
		//	stock = prodData.WebSO;
		//}
		var stockNote = "";
//		if (sku=="STM32L051C8T6") {
//			stockNote = stock+" currently in stock.";
//		}
		var buyButtonDisabled = '';
		if (stock < 1) {
			buyButtonDisabled = 'disabled';
		}
		
		var stockStatus = 'InStock'; // Structure product Offer https://schema.org/ItemAvailability
		if (stock > 0) { // We have stock for ordering
			var trigger = parseInt(prodData[PROD_LOWSTOCK_TRIGGER]);
			if (prodData[PROD_PRESALENOTE] != "") {
				// We have a preorder in progress, display prominant notice and fill in expected ship date
				stockNote = 'This item is out of stock but may be pre-ordered now. Expected restock date is '+prodData[PROD_PRESALENOTE]+'. Placing an order for this item will guarantee-reserve stock and shipment within 24 hours of '+
					'vendor delivery. You will be charged at the time of placing your order. You may cancel and request a full refund any time before shipment. Please read '+ 
					'our <a href="https://cabintechglobal.com/preorder-policy.html" target="_blank">Presale Policy</a> before placing your order. '+
					'<br><br>&nbsp;&nbsp;&nbsp;<img src="images/link-light.png">&nbsp;<a href="#" onclick="addCustomerOOS(\''+sku+'\');return false;">Get notified</a> when this item is back in stock.'

				stockStatus = 'PreOrder';
			}
			else if (stock < trigger) {
				// Low stock warning
				stockNote = 'Only '+stock+' units left in stock.';
			}
		}
		else { // Out of stock
			var subject = encodeURIComponent('Expected restock date for '+sku);
			stockNote = 'OUT OF STOCK'+
				'<br>&nbsp;&nbsp;&nbsp;<img src="images/link-light.png">&nbsp;<a href="#" onclick="addCustomerOOS(\''+sku+'\');return false;">Get notified</a> when this item is back in stock or becomes available to preorder ahead of stock arrival.' 
			var tableHTML = util.buildLinkedProductTable(prodData[PROD_COMPAT_LIST], prodData[PROD_SKU]);
			if (tableHTML != "") stockNote = stockNote+'<br><br>Consider the following compatible<span onclick="util.showCompatibilityNotice();return false;" class="link-style-simple">*</span> replacement parts:<br><div style="display:inline-block;background-color:white;color:black;">'+tableHTML+'</div>';
//			if (sku=="V2164M") { //v7.20
//				stockNote = stockNote+'<br>Consider this equivalent part: <a href="" onclick="return gotoProduct(\'AS2164-SMT\');">AS2164-SMT</a>'
//			}
			stockStatus = 'OutOfStock';
		}

		// Build HTML block for this product
		var html = [];
		html.push('<div class="simpleCart_shelfItem">');
		
		// Hidden fields used by the cart but not displayed
		html.push('<span style="display:none;" class="item_name">'+prodName+'</span>');
		html.push('<span style="display:none;" class="item_weight">'+prodData[PROD_WEIGHT]+'</span>');
		html.push('<span style="display:none;" class="item_sku">'+sku+'</span>');
		html.push('<span style="display:none;" class="item_pkg">'+prodPkg+'</span>');
		
		// Displayed fields
		var levelsDisplayed = 0;
		var minPrice = "0.00";
		var levelCount = prodData[PRICE_LEVELS].length;
		var showMoreMsg = false;
		for (var levelNum=0; levelNum<levelCount; levelNum++) {
			var level = prodData[PRICE_LEVELS][levelNum];
			if (level[PRICING_EACH_WEB]) { 
				// This level is for webpage display
				levelsDisplayed++;
				minPrice = level[PRICING_EACH_WEB]; // Min price will be the last pricing level
				//html.push('<span class="qty-discount"><span class="price-wrapper">$<span>'+price+'</span></span><small> when ordering <span>'+minQty+'</span> or more.</span>');
				if (levelsDisplayed == 1) {
					// First level assumes minQty=1 and has input field and cart button
					html.push('<span class="price-wrapper">$<span class="item_price">'+level[PRICING_EACH_WEB]+'</span></span>&nbsp;&nbsp;');
					html.push('Quantity:&nbsp;<input class="item_Quantity" type="number" value="1" min="1" max="99">&nbsp;&nbsp;');
					html.push('<small><button class="item_add" '+buyButtonDisabled+'>Add to Cart</button><br></small>');
				}
				else {
					html.push('<span class="qty-discount"><span class="price-wrapper">$<span>'+level[PRICING_EACH_WEB]+'</span></span><small> when ordering <span>'+level[PRICING_MINQTY]+'</span> or more</small></span><br>');
				}
				
				// If we are showing a large potential order, let customer know there may be more (e.g. bank transfer) discounts.
				if ((level[PRICING_EACH_WEB] * level[PRICING_MINQTY]) > 1000.00) {
					showMoreMsg = true;
				}
			}
		}
		
		if (levelsDisplayed == 0) { // Should never happen
			pcDiv.html('<span class="err-msg">Web site error: Did not find pricing data for SKU: '+sku+'. This error has been reported to our site administrator and will be fixed soon.</span>');
			util.reportJSError("ctg.util.buildProductCart() did not find any website pricing levels for SKU: "+sku);
			return;
		}
		
		
		if (showMoreMsg) {
			html.push('<span style="font-size:75%;font-style:italic;background-color:#EEEEEE;border:1px solid black;border-radius:4px;">');
			html.push('&nbsp;<a target="_blank" href="mailto:sales@cabintechglobal.com?subject=Quantity pricing on '+sku+'">Contact us</a> for additional discounts and alternate payment methods on this product&nbsp;</span>');
		}
		

//TODO Support >2 discount levels on the web site -- see code above
		
//		var price = prodData[PRICE_LEVELS][0][PRICING_EACH]; //v4.37 //TODO This assumes level zero is enabled for web
//		if (!prodData.SalePrice) {
//			// Normal pricing
//			html.push('<span class="price-wrapper">$<span class="item_price">'+price+'</span></span>&nbsp;&nbsp;');
//		} else {
//			// Sale pricing
//			html.push('<span class="price-wrapper-old">$'+price+'</span>&nbsp;&nbsp;');
//			html.push('<span class="price-wrapper-onsale">SALE PRICE $<span class="item_price">'+prodData.SalePrice+'</span></span>&nbsp;&nbsp;');
//			price = prodData.SalePrice;
//		}
//		
//		
//		html.push('Quantity:<input class="item_Quantity" type="number" value="1" min="1" max="99">&nbsp;&nbsp;');
//		html.push('<small><button class="item_add" '+buyButtonDisabled+'>Add to Cart</button><br></small>');
//		// Level 1 discount notice, if any
//		if (prodData[PRICE_LEVELS].length > 1) { 
//			price = prodData[PRICE_LEVELS][1][PRICING_EACH];
//			var minQty = prodData[PRICE_LEVELS][1][PRICING_MINQTY];
//			html.push('<span class="qty-discount"><span class="price-wrapper">$<span class="item_qprice">'+price+'</span></span><small> when ordering <span class="item_qtrigger">'+minQty+'</span> or more.</span>');
//		}
//		// Note higher levels if any (do not display them yet) //v4.37
//		if (prodData[PRICE_LEVELS].length > 2) {
//			var minQty = prodData[PRICE_LEVELS][2][PRICING_MINQTY];
//			html.push('<span class="qty-discount2">&nbsp;<a target="_blank" href="mailto:sales@cabintechglobal.com?subject=Quantity pricing on '+sku+'">Contact us</a> for quantity pricing on <span class="item_qtriggerN2">'+minQty+'</span> or more of this item.</span>');
//		}
//		html.push('</small>');
	
		
		// Stock notes, if any
		if (stockNote.length > 0) {
			html.push('<div class="stock-note">');
			html.push(stockNote);
			html.push('</div>')
		}
		
		html.push('</div>'); // simpleCart_shelfItem
		
		// Insert structured product data so search engines can understand this product and pricing info
		// https://developers.google.com/search/docs/data-types/product
		
		html.push('');
		html.push('<script type="application/ld+json">');
		html.push('{');
		html.push('  "@context": "http://schema.org/",');
		html.push('  "@type": "Product",');
		html.push('  "name": "'+sku+'",');
		html.push('  "image": [');
		html.push('    "https://cabintechglobal.com/images/prod/'+sku+'.jpg"'); //v8.77 include /prod/ part of path
		html.push('   ],');
		html.push('  "description": "'+prodData[PROD_MFG] + " " + prodData[PROD_SKU] + " "	+ prodData[PROD_DESC]+'",');
		html.push('  "mpn": "'+sku+'",');
		html.push('  "sku": "'+sku+'",');
		html.push('  "url": "https://cabintechglobal.com/'+sku+'",');
		html.push('  "brand": {');
		html.push('    "@type": "Brand",'); //v8.76 Changed from 'Organization' to 'Brand'
		html.push('    "name": "'+prodData[PROD_MFG]+'"');
		html.push('   },');
		html.push('  "offers": {');
		html.push('    "@type": "Offer",');
		html.push('    "priceCurrency": "USD",');
		html.push('    "price": "'+minPrice+'",'); // Show our lowest price
		html.push('    "availability": "http://schema.org/'+stockStatus+'",');
		html.push('    "url": "https://cabintechglobal.com/'+sku+'",');
		html.push('    "seller": {');
		html.push('     "@type": "Organization",');
		html.push('     "name": "Cabintech Global LLC"');
		html.push('    }');
		html.push('  }');
		html.push('}');
		html.push('</script>');
		
		// Update the UI with the generated HTML
		pcDiv.html(html.join(''));
		
		// JQuery init controls as needed
		try {
			pcDiv.find(".item_add").button();
		}
		catch(e) {} // Will fail if no Jquery is loaded (e.g. SEO prod page)
	},
	
	
	/**
	 * Sets up click handlers on all the body rows of the given table which
	 * will set the "row-selected" class on any (one) row that is clicked.
	 * It will also call the supplied function when a new row is selected.
	 * This must be called each time table rows are added or removed.
	 * @param tableSelector
	 * @returns
	 */
	enableRowSelection: function (tableSelector, selectEventHandler) {
		//$(tableSelector + " > tbody > tr").off("click"); // Remove all current handlers in this table
		$(tableSelector + " > tbody > tr").click(function(event) {
			// Do nothing if this is already the selected row
			if ($(this).hasClass("row-selected")) return;
			
			// Clear selected status from any other row
			$(this).parent().children().removeClass("row-selected");
			
			// Make this row selected
			$(this).addClass("row-selected");
			
			// Call the event handler and pass this <tr> row DOM object
			if (selectEventHandler) {
				selectEventHandler($(this));
			}
		});
		
	},

	/**
	 * Removes event handlers from all the body rows of the given table. This
	 * should be done before removing the rows to avoid memory leaks.
	 * @param tableSelector
	 * @returns
	 */
	disableRowSelection: function (tableSelector) {
		$(tableSelector + " > tbody > tr").off("click"); // Remove all current handlers in this table
	}, 
	
	/**
	 * Safe way to access deeply nested property values without risk of a runtime JS
	 * error if a property on the path does not exist (in which case this function
	 * returns an empty string). See https://stackoverflow.com/questions/48272814/avoid-cannot-read-property-of-undefined-error-when-trying-to-check-for-grandc
	 * 
	 * Usage:
	 * var firstName = util.getStrProp(paypalOrder, 'payment_source.paypal.name.given_name');
	 * 
	 * Note the keyPath cannot contain an array subscript.
	 */
	getStrProp: function(rootObject, keyPath) {
		  return keyPath.split('.').reduce((current, memo) => {
		    return current ? current[memo] : ""
		  }, rootObject);
	},
	
	/**v8.89
	 * Long-poll the server to get real-time updates to orders so this UI can stay in
	 * sync with order updates and new orders coming in. This is a quasi-recurrsive
	 * function that calls itself for the next polling cycle (not truely recurssive
	 * because the call is made async).
	 * 
	 * Note this calls a priv server endpoint.
	 */
	longPoll: function (myId, option, eventHandler, errorHandler) {
		
		// This call to the server will (normally)
		// wait up to the server's polling timeout (2 minutes) before returning. The 
		// server call returns quickly only if the server has data waiting to send, or
		// if the call fails. This polling continues for as long as this page is loaded.
		
		// Note this ajax call is async, this longPoll() method starts the server call
		// and then ends (returns) before the call completes.
		
		util.ajaxCall(
			"LongPoll", 
			"clientid="+myId+(option ? "&option="+option : ""), 
			function(event) { // OK (status 200)
			
				// Pass this event to the supplied handler.  Do not allow any errors in the handler
				// to prevent the following code.
				try {
					if (eventHandler) eventHandler(event);
				} catch (err) {
					console.log("Error in long poll event handler: "+err);
				}	
	
				// Continue the polling cycle			
				if (event[LP_CMD] == LP_CMD_DOWN) {
					// Server is shutting down.
					// No need to poll again right away, wait a bit for it to come back up and request
					// an immediate response.
					setTimeout(util.longPoll, 30*1000, myId, "immediate", eventHandler, errorHandler);
					return; // Not BREAK, we don't want to poll again right now
				}
				else {
					util.longPoll(myId, null, eventHandler, errorHandler); // Call and wait again
				}
				
			}, 
			function(xhr) { // Error
				try {
					if (errorHandler) errorHandler(xhr);
				} catch (err) {
					console.log("Error in long poll error handler: "+err);
				}
				
				// Do not poll again right away or we may get into a tight call/error loop. Wait a
				// bit, but not too long as we want to update again soon after the server restarts.
				// We add the IMMEDIATE option for the first call so we can clear the error from
				// the UI without waiting for a full polling delay (e.g. 2 minutes).
			
				setTimeout(util.longPoll, 30*1000, myId, "immediate", eventHandler, errorHandler);
			}
		);
	}
	


};

var CtgDateTime = {
	// These functions roughly parallel the CtgDateTime.java utility methods. These are
	// essentially static utility methods.
		
	msecPerMinute : 1000 * 60,  
	msecPerHour : (1000 * 60) * 60,  
	msecPerDay : ((1000 * 60) * 60) * 24, 
	msecPerYear: (((1000 * 60) * 60) * 24) * 365,
	
	/**
	 * Returns the given Date object formatted to ISO 8601 with
	 * 1 second resolution and UTC time zone. Note this is slightly
	 * different than Javascript Date.toISOString() which always
	 * includes a 3-digit msec part.
	 * 
	 * If no fromDate is supplied, the current time/date is used.
	 */
	toStoreFormat : function(fromDate) {
		fromDate = CtgDateTime.getDate(fromDate);

		var s = fromDate.toISOString();
		if (s.length == 24) {
			// YYYY-MM-DDTHH:mm:ss.sssZ
			s = s.substring(0,19)+"Z"; // Remove msec
		}
		return s;
	},
	
	/**
	 * Tries to coherse the arg into a Date object. Valid inputs are
	 * - Date objects (returnee as-is)
	 * - String in ISO 8601 format ("YYYY-MM-DD...")
	 * - String containing an integer msec epoch timestamp
	 * - Integer (number) that is a msec epoch timestamp
	 * - null or undefined returns new Date()
	 * All else return a new Date(maybeDate) and hope for the best
	 */
	getDate: function(maybeDate) {
		if (!maybeDate) return new Date(); // Current time
		if (maybeDate instanceof Date) {
			return maybeDate;
		}
		else if (typeof maybeDate == "string") {
			if (util.isNumeric(maybeDate)) {
				return new Date(parseInt(maybeDate)); // Assume it is an epoch msec timestamp
			}
			if (maybeDate.indexOf('-') == 4) { // Perhaps an ISO 8601 date string
				return new Date(maybeDate);
			}
		}
		else if (typeof maybeDate == "number") { // Assume msec epoch
			return new Date(maybeDate);
		}
		// No idea what this is, let Date try to handle it, but will probably fail
		alert("unknow maybeDate");
		return new Date(maybeDate);
	},
	
	/**
	 * Returns date format "YYYY-MM-DD HH:MM AP" in browser-local time zone.
	 */
	toDisplayShort: function(fromDate) {
		fromDate = CtgDateTime.getDate(fromDate);

		//TODO Might save some work with: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
		//TOOD Does not produce 2-digit values when <10 (good for vertical UI alignment) 
		var s = [];
		s.push(fromDate.getFullYear()+'-');
		s.push(CtgDateTime.twoDigit((fromDate.getMonth()+1))+'-');
		s.push(CtgDateTime.twoDigit(fromDate.getDate())+' ');
		var h = fromDate.getHours();
		var ampm = "AM";
		if (h > 12) {
			ampm = "PM";
			h = h - 12;
		}
		s.push(CtgDateTime.twoDigit(h)+':');
		s.push(CtgDateTime.twoDigit(fromDate.getMinutes())+' ');
		s.push(ampm);
		return s.join("");
		
	},
	
	toDisplayDateOnly: function(fromDate) {
		fromDate = CtgDateTime.getDate(fromDate);

		//TODO Might save some work with: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
		var s = [];
		s.push(fromDate.getFullYear()+'-');
		s.push(CtgDateTime.twoDigit((fromDate.getMonth()+1))+'-');
		s.push(CtgDateTime.twoDigit(fromDate.getDate()));
		return s.join("");
	},
	
	toDisplayLong: function(fromDate) {
		fromDate = CtgDateTime.getDate(fromDate);
		//TODO Without lots of work, this is as close as we can get to the Java version.
		// With more work we could use Intl.DateTimeFormat (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat)
		// and its formatToParts() method (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts)
		return fromDate.toLocaleDateString("us-EN", {
			weekday: 'long', 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric',
			hour12: true,
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric'
		});
	},
	
	sameDay: function(d1, d2) {
		return d1.getUTCDate()==d2.getUTCDate() && d1.getUTCMonth()==d2.getUTCMonth() && d1.getUTCFullYear()==d2.getUTCFullYear()
	},
	
	/**
	 * Return a numeric value of the number of days since the given date, returns negative
	 * values for future dates.
	 */
	toNumberOfDaysAgo: function(fromDate) {
		fromDate = CtgDateTime.getDate(fromDate);
		var interval = (new Date()).getTime() - fromDate.getTime();
		return Math.floor(interval / CtgDateTime.msecPerDay);
	},
	
	toDaysAgo: function(fromDate) {
		// Return years and days since the given date
		fromDate = CtgDateTime.getDate(fromDate);
		var nowDate = new Date();
		//console.log("Now: "+nowDate);
		//console.log("From: "+fromDate);
		
		// Today?
		if (CtgDateTime.sameDay(nowDate, fromDate)) {
			return "today";
		}
		
		// Yesterday?
		var yesterday = new Date(nowDate.getTime()-CtgDateTime.msecPerDay);
		if (CtgDateTime.sameDay(yesterday, fromDate)) {
			return "yesterday";
		}
		
		// How many years and days?
		
		var interval = nowDate.getTime() - fromDate.getTime();
		if (interval < 0) {
			return "future";
		}
		
		// Calculate how many days the interval contains. Subtract that  
		// many days from the interval to determine the remainder.  
		// From: https://docs.microsoft.com/en-us/scripting/javascript/calculating-dates-and-times-javascript

		let fYears = (interval / CtgDateTime.msecPerYear).toFixed(1);
		if (fYears > 1) {
			return fYears + " years ago";
		}
		
		var years = Math.floor(interval / CtgDateTime.msecPerYear );
		interval = interval - (years * CtgDateTime.msecPerYear );  
		
		var days = Math.floor(interval / CtgDateTime.msecPerDay );  

		if (years > 0) {
			return years + (years>1?" years, ":" year, ") +days+ (days>1?" days ago":" day ago");
		}
		return days+" days ago";
	},
	
	toAge: function(fromDate) {
		// Return elapsed age of the given date from NOW in a compact format
		fromDate = CtgDateTime.getDate(fromDate);
		var nowDate = new Date();
		var interval = nowDate.getTime() - fromDate.getTime();
		
		// Calculate how many days the interval contains. Subtract that  
		// many days from the interval to determine the remainder.  
		// From: https://docs.microsoft.com/en-us/scripting/javascript/calculating-dates-and-times-javascript
		
		var years = Math.floor(interval / CtgDateTime.msecPerYear );
		interval = interval - (years * CtgDateTime.msecPerYear );  
		
		var days = Math.floor(interval / CtgDateTime.msecPerDay );  
		interval = interval - (days * CtgDateTime.msecPerDay );  

		// Calculate the hours, minutes, and seconds.  
		var hours = Math.floor(interval / CtgDateTime.msecPerHour );  
		interval = interval - (hours * CtgDateTime.msecPerHour );  

		var minutes = Math.floor(interval /CtgDateTime. msecPerMinute );  
		interval = interval - (minutes * CtgDateTime.msecPerMinute );  
		
		var s = [];
		if (years > 0) {
			s.push(years+"y");
			s.push(CtgDateTime.twoDigit(days)+"d")
		}
		else {
			if (days > 0) {
				s.push(days+"d");
				s.push(CtgDateTime.twoDigit(hours)+"h");
			}
			else {
				if (hours > 0) {
					s.push(hours+"h");
					s.push(CtgDateTime.twoDigit(minutes)+"m");
				}
				else {
					s.push(CtgDateTime.twoDigit(minutes)+"m");
				}
			}
		}
		return s.join("");
	},

	
	/**
	 * Helper for date formatting functions, return 2-digit string for all values 0-99
	 */
	twoDigit: function(n) {
		if (n < 10) {
			return '0'+n;
		}
		return n+'';
	}

};