
(function() {

	var baseUrl = 'http://angelhack.firebase.com/easymapr/';
	var hash = document.location.hash.substring(1);
	var username;

	var pinsPath, chatPath, directionsPath, usersPath;

	var currentPinNumber = 0;


	var buildUrl = function(name) {
		return baseUrl + hash + '/' + name;
	}

	var connect = function() {

		var pinsUrl = buildUrl('pins');
		var chatUrl = buildUrl('chat');
		var directionsUrl = buildUrl('directions');
		var usersUrl = buildUrl('users');

		pinsPath = new Firebase(pinsUrl);
		chatPath = new Firebase(chatUrl);
		directionsPath = new Firebase(directionsUrl);
		usersPath = new Firebase(usersUrl);
	}

	var bindListeners = function() {

		pinsPath.on('child_added', function(snapshot) {
			pinReceived(snapshot.name(), snapshot.val());
		});

		pinsPath.on('child_removed', function(snapshot) {
			pinReceived(snapshot.name(), snapshot.val());
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

	var bindUi = function() {

		$("#messageSend").click(function() {
			sendMessage();
		});

		$("#addPin").click(function() {
			var city = searchCity($("#pinLookup").val());
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

	var addPin = function(user, name, lat, lon) {
		pinsPath.push({
			user: username,
			name: name,
			lat: lat,
			lon: lon
		});

	}

	var pinReceived = function(id, data) {
		console.log(id);
		console.log(data);
		
		$('#map_canvas').gmap('addMarker', { /*id:'m_1',*/ 'location': data.lat+','data.long, 'bounds': true } );                                                                                                                                                                                                                

	}

	var removePin = function(id) {
		pinsPath.child(id).remove();
	}

	var pinRemoved = function(id) {
		console.log("Pin removed: " + id);
	}


	$(document).ready(boot);

})();