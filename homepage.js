(function() {

	var baseUrl = 'http://angelhack.firebase.com/easymapr/';
	var path, video;

	var connect = function() {
		path = new Firebase(baseUrl);
	}

	var startTokbox = function() {

		var map = path.push();

		TBSong.createSession(function(id) {

			map.child("video").set(id);

			startMap(map);
		});

		return false;
	}

	var startMap = function(map) {

		var from = $("#from").val();
		var to = $("#to").val();

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

		$("form").submit(startTokbox);
		$("#start").click(startTokbox);

	}

	$(document).ready(boot);


})();