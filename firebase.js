
var directionsManager;
(function() {

	var baseUrl = 'http://angelhack.firebase.com/easymapr/';
	var hash = document.location.hash.substring(1);
	var username;

	var pinsPath, chatPath, waypointsPath, usersPath;

	var tokbox;
	var tokboxApiKey = '12571782';


	var buildUrl = function(name) {
		return baseUrl + hash + '/' + name;
	}

	var connect = function() {

		var pinsUrl = buildUrl('pins');
		var chatUrl = buildUrl('chat');
		var waypointsUrl = buildUrl('waypoints');
		var usersUrl = buildUrl('users');

		pinsPath = new Firebase(pinsUrl);
		chatPath = new Firebase(chatUrl);
		waypointsPath = new Firebase(waypointsUrl);
		usersPath = new Firebase(usersUrl);
	}


	var map = null;
	var points;
	var myUpdate = false;

	var bindListeners = function() {

		pinsPath.on('child_added', function(snapshot) {
			pinReceived(snapshot.name(), snapshot.val());
		});

		pinsPath.on('child_removed', function(snapshot) {
			pinReceived(snapshot.name(), snapshot.val());
		});

		pinsPath.on('child_changed', function(snapshot) {
			pinReceived(snapshot.name(), snapshot.val());
		});

		waypointsPath.on('value', function(snapshot) {

			if(myUpdate) {
				myUpdate = false;
				return;
			}
			
			points = new Array();

			snapshot.forEach(function(child){
				points.push(child.val());
			});

			showPoints(points);
		});

		chatPath.on('child_added', function(childSnapshot) {

		  var message = childSnapshot.val();

		  $("#messagesDiv").append("<em>" + message.name + "</em>: " + message.text + "<br />");
		  $('#messagesDiv')[0].scrollTop = $('#messagesDiv')[0].scrollHeight;
		});

	    usersPath.on('value', function (presenceSnapshot) {
	      var presenceData = presenceSnapshot.val();

	      var users = [];
	      for (var user in presenceData) {
	        users.push(user);
	      }
	      users.sort();

	      $('#users').empty()
	      for (var i = 0; i < users.length; i++) {
	        $('#users').append(users[i] + ' is currently ' + presenceData[users[i]] + '<br />');
	      }
	    });
	}

	var handlerId;

	var showPoints = function(points) {

		directionsManager.resetDirections();

		if(handlerId) {
			Microsoft.Maps.Events.removeHandler(handlerId);
		}

		for(var i in points) {

        	var config = {};
        	var p = points[i];

        	if(p.type == "address") {
        		config.address = p.name;
        	} else if(p.type == "location") {
        		var loc = new Microsoft.Maps.Location(p.lat, p.long);
        		config.location = loc;
        	} else {
        		console.log("Waypoint error");
        		console.log(p);
        	}

        	// if(i != 0 && i != points.length - 1) {
        	// 	config.isViapoint = true;
        	// }

        	var startWaypoint = new Microsoft.Maps.Directions.Waypoint(config);

        	var idx = parseInt(p.idx);
        	directionsManager.addWaypoint(startWaypoint, idx);
        }



	    handlerId = Microsoft.Maps.Events.addHandler(directionsManager, 'waypointAdded', waypointHandler);

        // Calculate directions, which displays a route on the map
        directionsManager.calculateDirections();
	}

	var bindUi = function() {

		$("#messageSend").click(function() {
			sendMessage();
		});

		$("#addPin").click(function() {
			var city = searchCity($("#pinLookup").val());
			$("#pinLookup").val("");
		});

		$("#deletePin").click(function() {
			var id = $("#pinLookup").val();

			removePin(id);

		});
	}

	var sendMessage = function() {
		chatPath.push({
		  name:username,
		  text:$("#messageInput").val()
		});
		$("#messageInput").val("");
		$("#messageInput").focus();
	}

	var boot = function() {

		connect();

		bindListeners();

		// username = prompt("Username");
		username = Math.round(Math.random() * 1000)	;
		var user = usersPath.child(username);
		user.set(true);
		user.removeOnDisconnect();

		bindUi();

	}
	
	var searchCity = function (city_name){
		$('#map_canvas').gmap('search', { 'address': city_name }, function(result, status) {
		if ( status === 'OK' ) {
			var city = new Object();
			var r = result;
			city.lat = r[0]['resources'][0]['point']['coordinates'][0];
			city.long = r[0]['resources'][0]['point']['coordinates'][1];
			city.name = r[0]['resources'][0]['address']['formattedAddress'];
			city.country = r[0]['resources'][0]['address']['countryRegion'];
			
			if (city != false){
				addPin(Math.random(), city.name, city.lat, city.long);
			}else{
				alert("could not find your pin");
			}
		}else{
			return false;
		}
		
	});
	
	}

	var addPin = function(user, name, lat, long) {
		pinsPath.push({
			user: username,
			name: name,
			lat: lat,
			long: long
		});
	}

	var pinReceived = function(id, data) {
		console.log(id);
		console.log(data);
		if(data.lat != 'null' && data.long != 'null'){
			$('#map_canvas').gmap('addMarker', { /*id:'m_1',*/ 'location': data.lat+','+data.long, 'bounds': true } ); 
		}                                                                                                                                                                                                                                                                                                                                                                                                                              

	}

	var removePin = function(id) {
		pinsPath.child(id).remove();
	}

	var pinRemoved = function(id) {
		console.log("Pin removed: " + id);
	}

	var movePin = function(id, lat, long) {
		var pin = pinsPath.child(id);

		pin.set({
			lat: lat,
			long: long
		});
	}

	var pinMoved = function(id, lat, long) {
		console.log("Moved");
		console.log(arguments);
	}

	var addWaypoint = function(data) {
		myUpdate = true;
		waypointsPath.push(data);
	}

	var waypointHandler = function(wp) {

    	Microsoft.Maps.Events.addHandler(wp.waypoint, 'changed', function() {
        	var loc = wp.waypoint.getLocation();
        	var waypoint = {};
        	waypoint.type = "location";
        	waypoint.lat = loc.latitude;
        	waypoint.long = loc.longitude;

        	var wps = directionsManager.getAllWaypoints();

        	console.log(wp.waypoint);

        	for(var i in wps) {

        		console.log(wps[i]);

        		if(wp.waypoint == wps[i]) {
        			console.log("Similar " + i);

        			waypoint.idx = i;

		        	addWaypoint(waypoint);
        		} else {
        			console.log("Different");
        		}
        	}

    	});
    }

	var apiKey = 1127; 
	var sessionId = '153975e9d3ecce1d11baddd2c9d8d3c9d147df18';
	var token = 'devtoken'; 

	var session;
	var publisher;
	var subscribers = {};

	var connectVideo = function() {
		TB.addEventListener('exception', exceptionHandler);

		if (TB.checkSystemRequirements() != TB.HAS_REQUIREMENTS) {
			alert("You don't have the minimum requirements to run this application."
				  + "Please upgrade to the latest version of Flash.");
		} else {
			session = TB.initSession(sessionId);	// Initialize session

			// Add event listeners to the session
			session.addEventListener('sessionConnected', sessionConnectedHandler);
			session.addEventListener('sessionDisconnected', sessionDisconnectedHandler);
			session.addEventListener('connectionCreated', connectionCreatedHandler);
			session.addEventListener('connectionDestroyed', connectionDestroyedHandler);
			session.addEventListener('streamCreated', streamCreatedHandler);
			session.addEventListener('streamDestroyed', streamDestroyedHandler);
		}

		connectTok();
	}

	var connectTok = function() {
		session.connect(apiKey, token);
	}

	var disconnect = function() {
		session.disconnect();
		hide('disconnectLink');
		hide('publishLink');
		hide('unpublishLink');
	}

	// Called when user wants to start publishing to the session
	var startPublishing = function() {
		if (!publisher) {
			/*
			var parentDiv = document.getElementById("myCamera");
			var publisherDiv = document.createElement('div'); // Create a div for the publisher to replace
			publisherDiv.setAttribute('id', 'opentok_publisher');
			parentDiv.appendChild(publisherDiv);
			*/
			publisher = session.publish("myVideo"); // Pass the replacement div id to the publish method
			show('unpublishLink');
			hide('publishLink');
		}
	}

	var stopPublishing = function() {
		if (publisher) {
			session.unpublish(publisher);
		}
		publisher = null;

		show('publishLink');
		hide('unpublishLink');
	}

	//--------------------------------------
	//  OPENTOK EVENT HANDLERS
	//--------------------------------------

	var exceptionHandler = function() {
		console.log(arguments);
	}

	var sessionConnectedHandler = function(event) {
		// Subscribe to all streams currently in the Session
		for (var i = 0; i < event.streams.length; i++) {
			addStream(event.streams[i]);
		}
		show('disconnectLink');
		show('publishLink');
		hide('connectLink');

		startPublishing();
	}

	var streamCreatedHandler = function(event) {
		// Subscribe to the newly created streams
		for (var i = 0; i < event.streams.length; i++) {
			addStream(event.streams[i]);
		}
	}

	var streamDestroyedHandler = function(event) {
		// This signals that a stream was destroyed. Any Subscribers will automatically be removed.
		// This default behaviour can be prevented using event.preventDefault()
	}

	var sessionDisconnectedHandler = function(event) {
		// This signals that the user was disconnected from the Session. Any subscribers and publishers
		// will automatically be removed. This default behaviour can be prevented using event.preventDefault()
		publisher = null;

		show('connectLink');
		hide('disconnectLink');
		hide('publishLink');
		hide('unpublishLink');
	}

	var connectionDestroyedHandler = function(event) {
		// This signals that connections were destroyed
	}

	var connectionCreatedHandler = function(event) {
		// This signals new connections have been created.
	}

	/*
	If you un-comment the call to TB.addEventListener("exception", exceptionHandler) above, OpenTok calls the
	exceptionHandler() method when exception events occur. You can modify this method to further process exception events.
	If you un-comment the call to TB.setLogLevel(), above, OpenTok automatically displays exception event messages.
	*/
	function exceptionHandler(event) {
		console.log("Exception: " + event.code + "::" + event.message);
	}

	//--------------------------------------
	//  HELPER METHODS
	//--------------------------------------

	function addStream(stream) {
		// Check if this is the stream that I am publishing, and if so do not publish.
		if (stream.connection.connectionId == session.connection.connectionId) {
			return;
		}

		var div = $("<div/>");
		var id = 'idstream.streamId';
		div.attr("id", id);
		$("#theirVideos").append(div);

		subscribers[stream.streamId] = session.subscribe(stream, id);
	}

	function show(id) {
		console.log("Show: " + id);
	}

	function hide(id) {
		console.log("Hide: " + id);
	}


	var consoler = function(text) {
		return function() {
			console.log(text);
		}
	}

	var createMap = function() {

		map = new Microsoft.Maps.Map(document.getElementById("map_canvas"),{credentials:'AlKHLj54K3fKIEgx5aPkf759mo1FC-jxpqhgA199T-8eIr-YbHysBD0W7zaWBCyb'});
		Microsoft.Maps.loadModule('Microsoft.Maps.Directions', { callback: directionsModuleLoaded });
	}


	var directionsModuleLoaded = function() {

        directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);

	    // Set the id of the div to use to display the directions
	    directionsManager.setRenderOptions({ itineraryContainer: document.getElementById('panel') });

	    // Specify a handler for when an error occurs
	    Microsoft.Maps.Events.addHandler(directionsManager, 'directionsError', function() {
	    	console.log(arguments);
	    });

     }

	var boot = function() {

		createMap();

		connect();

		bindListeners();

		// username = prompt("Username");
		username = Math.round(Math.random() * 1000)	;
		var user = usersPath.child(username);
		user.set(true);
		user.removeOnDisconnect();

		bindUi();

		//connectVideo();

	}

	$(document).ready(boot);

})();