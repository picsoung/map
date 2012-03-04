
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

			console.log(snapshot.val());
			console.log(snapshot.name());

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
			addPin(Math.random(), Math.random(), Math.random(), Math.random());
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

	var addPin = function(user, name, lat, lon) {

		pinsPath.push({
			user: username,
			name: name,
			lat: lat,
			lon: lon
		});

	}


	$(document).ready(boot);

})();