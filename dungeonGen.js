$(function() {
'use strict';

	var sizeOpts, 
		sizeChoice,
		tSize,
		points, 
		posit, 
		tile = $('canvas')[0].getContext('2d'), 
		tileOut = $('canvas')[0].getContext('2d'),
		width = $('canvas').width(), 
		x = width/2,
		height = $('canvas').height(), 
		y = height/2,
		coords = {"xPos":x, "yPos":y}; //default coordinates

	//the initial black background
	tile.fillStyle = "rgb(0,0,0)";
	tile.fillRect(0, 0, width, height);

	//disable the editing buttons upon app launch
	$('#addButton').prop('disabled', true);
	$('#undoButton').prop('disabled', true);

	//Define a tile object
	function Tiles(color) {
		this.inStack = [];
		this.tileSize = tSize;
		this.color = color;
		//find the index of the input coordinates in the tile array inStack
		this.whereInStack = function(posit) {
			for(var i = 0; i < this.inStack.length; i ++){
				if(this.inStack[i][0] == posit[0] && this.inStack[i][1] == posit[1]) {
					return i;
				}
			}
			return false;
		};
	}

	//use this to keep track of the current dungeon tiles
	var dungeonStack = new Tiles('rgb(255,255,255)');

	function drawTile(coords, size, color) {
		tile.fillStyle = color;
		tile.fillRect(coords[0], coords[1], size, size);
		tileOut.strokeRect(coords[0], coords[1], size, size);
	}

	//pick a random point in the subdungeon to be the room location
	function getRoomCenter(points, size, Ntiles){
		var randTile = Math.round(Math.random()*(Ntiles-1)),
			tempX = points[randTile][0],
			tempY = points[randTile][1];
		//randomly pick where the center of the room will be
		switch (Math.round(Math.random() * 8)) {
			case 0: { tempX += size; break; }
			case 1: { tempX -= size; break; }
			case 2: { tempY += size; break; }
			case 3: { tempY -= size; break; }
			case 4: { tempX += size; tempY += size; break; }
			case 5: { tempX -= size; tempY += size; break; }
			case 6: { tempX += size; tempY -= size; break; }
			case 7: { tempX -= size; tempY -= size; break; }
			case 8: break;
		}	

		return [tempX, tempY];	
	}

	function buildRoom(dungeonStack, center, size){
		var x = center[0],
			y = center[1];
		for (var xind = x - size; xind <= x + size; xind += size) {
			for (var yind = y - size; yind <= y + size; yind += size) {
				posit = [xind, yind];
				if(!dungeonStack.whereInStack(posit)){
					points.push(posit);
					dungeonStack.inStack.push(posit);
				}
			}
		}
	}

	function isInBounds(posit){
		var x = posit[0],
			y = posit[1];
		return (x >= 15 && x <= width - 20 && y >= 15 && y <= height - 20);
	}

	function addTiles(sizeOpts, divis) {
		var currentX = Math.floor(coords.xPos/tSize)*tSize, //turns the continuous grid into discrete blocks
			currentY = Math.floor(coords.yPos/tSize)*tSize,
			tempX = currentX, 
			tempY = currentY, 
			update = 1, //as in change the dungeon path direction
			tileCounter = 1, 
			direction = Math.round(Math.random()*3), //used to determine the direction of the dungeon path
			Nrand, 
			rmCent; 
		
		points = [];
		if(!dungeonStack.whereInStack([currentX, currentY])) {
			points.push([currentX, currentY]);
			dungeonStack.inStack.push([currentX, currentY]);
		}

		while (tileCounter < sizeOpts.tileLimit) {
			//pick a direction to build in
			switch(direction) {
				case 0: { tempX += sizeOpts.tileSize; break; }
				case 1: { tempX -= sizeOpts.tileSize; break; }
				case 2: { tempY += sizeOpts.tileSize; break; }
				case 3: { tempY -= sizeOpts.tileSize; break; }
			}
			posit = [tempX, tempY];

			if(!dungeonStack.whereInStack(posit)) {
				if(isInBounds(posit)) {
					//if the temp position is not a current floor tile and is in bounds then accept it
					points.push(posit);
					dungeonStack.inStack.push(posit);
					currentX = tempX;
					currentY = tempY;
					tileCounter++;
					//sizeOpts.line is how long straight paths should be
					if(update > sizeOpts.line) {
						Nrand = Math.round(Math.random()*3);
						if(direction != Nrand) {
							update = 0;
							direction = Nrand;
						}
					}
					update ++;
				}
				else {
					//randomly pick a different point in the current sub-dungeon to build at
					Nrand = Math.round(Math.random()*(tileCounter - 1));
					currentX = points[Nrand][0];	
					currentY = points[Nrand][1];	
					tempX = currentX;
					tempY = currentY;
					update = 1; 
					direction = Math.round(Math.random()*3);
				} 
			}
		}

		for(var r = 0; r < sizeOpts.tileLimit/divis; r++) {
			rmCent = getRoomCenter(points, sizeOpts.tileSize, sizeOpts.tileLimit);
			buildRoom(dungeonStack, rmCent, sizeOpts.tileSize);
		}

		dungeonStack.color = 'rgb(255, 255, 255)';
		tileOut.fillStyle = 'rgb(0,0,0)';
		//draw the floor tiles
		points.forEach(function(point) {
			drawTile(point, sizeOpts.tileSize, dungeonStack.color);
		});
		return points;
	}

	$('#creativeMode').click(function() {
		$('#creMode').toggle(this.checked);
	});

	$('canvas').click(function(e) {
		//records the coordinates of the canvas click
		x = e.pageX - $('canvas').offset().left;
		y = e.pageY - $('canvas').offset().top;
		coords = {"xPos":x,"yPos":y};

		if($('#creativeMode').is(':checked')) {
			sizeChoice = $("input[name='size']:checked").val();
			tSize = 10;
			if(sizeChoice == 'small') {
				tSize = 20;
			}
			else if(sizeChoice == 'medium') {
				tSize = 15;
			}

			x = Math.floor(x/tSize)*tSize;
			y = Math.floor(y/tSize)*tSize;
			posit = [x, y];

			if($('input[name="edit"]:checked').val()=='add') {
				//add tiles
				dungeonStack.color = 'rgb(255, 255, 255)';
				if(!dungeonStack.whereInStack(posit)) {
					dungeonStack.inStack.push(posit);
				}
				if(dungeonStack.inStack.length*tSize*tSize >= 0.2*width*height) {
					$('#addButton').prop('disabled', true);
				}
				
			}
			else{
				//remove tiles
				dungeonStack.color = 'rgb(0,0,0)';
				if(dungeonStack.whereInStack(posit)){ 
					dungeonStack.inStack.splice(dungeonStack.whereInStack(posit), 1);
				}
				if(dungeonStack.inStack.length*tSize*tSize < 0.2*width*height) {
					$('#addButton').prop('disabled', false);
				}

			}
			drawTile(posit, tSize, dungeonStack.color);			
		}
	});

	$("#dungButton").click(function(){
		tile.fillStyle = "rgb(0,0,0)";
		tile.fillRect(0, 0, width, height);
		sizeChoice = $("input[name='size']:checked").val();

		sizeOpts = {"tileSize":10, "tileLimit": 200, "Nroom": 30, "line":15};

		//determines number of tiles, size of tiles, the nubmer of rooms, and how long straight halls can be
		if (sizeChoice == "small") {
			sizeOpts = {"tileSize":20, "tileLimit": 50, "Nroom": 10, "line":5};
		}
		else if (sizeChoice == "medium") {
			sizeOpts = {"tileSize":15, "tileLimit": 130, "Nroom": 20, "line":10};
		}
		tSize = sizeOpts.tileSize;

		//determines how much branching occurs
		var branChoice = $("input[name='density']:checked").val();
		if (branChoice == "little") {
			sizeOpts.line *= 1.5;
		}
		else if (branChoice == "high") {
			sizeOpts.line *= 0.35;
		}

		//determines how many rooms are present
		var roomChoice = $("input[name='roomArea']:checked").val(),
			divis = 2;
		if (roomChoice == "few") {
			divis = 10;
		}
		else if (roomChoice == "mid") {
			divis = 5;
		}
	
		dungeonStack.inStack = [];
		points = addTiles(sizeOpts, divis);

		//allow for you to edit number of dungeon tiles
		$('#addButton').prop('disabled', false);
		$('#creativeMode').removeAttr('style');
	});

	$('#addButton').click(function(){
		sizeOpts = {"tileSize":tSize, "tileLimit": 200, "Nroom": 30, "line":15};
		sizeChoice = $('input[name="size"]:checked').val();
		if (sizeChoice == "small") {
			sizeOpts = {"tileSize":tSize, "tileLimit": 50, "Nroom": 10, "line":5};
		}
		else if (sizeChoice == "medium") {
			sizeOpts = {"tileSize":tSize, "tileLimit": 130, "Nroom": 20, "line":10};
		}

		var branChoice = $("input[name='density']:checked").val();
		if (branChoice == "little") {
			sizeOpts.line *= 1.5;
		}
		else if (branChoice == "high") {
			sizeOpts.line *= 0.35;
		}

		var roomChoice = $("input[name='roomArea']:checked").val(),
			divis = 2;
		if (roomChoice == "few") {
			divis = 10;
		}
		else if (roomChoice == "many") {
			divis = 5;
		}

		//does not reset dungeonStack.inStack
		points = addTiles(sizeOpts, divis);

		$('#undoButton').prop('disabled', false);

		//if we reach a threshold of over 20% of the canvas area is filled, then stop adding
		if(dungeonStack.inStack.length*tSize*tSize >= 0.2*width*height) {
			$('#addButton').prop('disabled', true);
		}
	});

	$('#undoButton').click(function() {
		dungeonStack.color = 'rgb(0, 0, 0)';

		//loop through the last points added through addButton and remove them
		for(var i = 0; i < points.length; i ++){
			drawTile(points[i], tSize, dungeonStack.color);
			dungeonStack.inStack.splice(-1,1);
		}
		$('#undoButton').prop('disabled', true);

		//if the dungeon area drops past the threshold then you can add tiles again
		if(dungeonStack.inStack.length*tSize*tSize < 0.2*width*height) {
			$('#addButton').prop('disabled', false);
		}
	});
});
