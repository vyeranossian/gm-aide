$(function() {
	"use strict";
	$('#NPCButton').click(function() {
		$('#Race').show();
		$('#RoomType').hide();
	});
	
	$('#roomButton').click(function() {
		$('#RoomType').show();
		$('#Race').hide();
	});

	$('#submitRead').click(function() {
		//make a query to the db and get some values
		var keys = getSelection(), key;
		for(var i = 0; i < keys.length; i++) {
			key = keys[i];
			$.ajax({
				type: 'GET',
				url: 'http://localhost:8080/redisGetDescription.py',
				data: key,
				success: function(response) {
					$('#results').append('<tr><td>' + key + '</td><td>' + response + '</td></tr>');
				},
				error: function(err) {
					alert(err);
				}
			});
		}
	});

	function getSelection() {
		var keys;
		if($('#Race').is(':visible')) {
			var race = $('#Race').val();
			keys = [race, race+"L", 'Personality', 'Description'];
		}
		else if($('#RoomType').is(':visible')) {
			keys = [$('#RoomType').val()];
		}
		return keys;
	}

});
