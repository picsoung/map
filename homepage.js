(function() {

	var baseUrl = 'http://angelhack.firebase.com/easymapr/';
	var path;

	var connect = function() {
		path = new Firebase(baseUrl);
	}

	var startMap = function() {
		var from = $("#from").val();
		var to = $("#to").val();

		var map = path.push();

		var waypointsPath = map.child("waypoints");
		waypointsPath.push().set({
			type: "address",
			name: from,
			idx: 0
		});
		waypointsPath.push().set({
			type: "address",
			name: to,
			idx: 1
		});

		console.log(map.name());

		var id = map.name();

		document.location = "layout.html#" + id;

	}

	var boot = function() {

		connect();

		
		$("#start").click(startMap);

	}

	$(document).ready(boot);


})();