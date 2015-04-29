$(function() {
'use strict';

	var sizeOpts, 
		sizeChoice,
		tSize,
		points, 
		latestRooms,
		roomCounter = 0,
		deadCounter = 0,
		posit,
		tile = $('canvas')[0].getContext('2d'),  
		tileOut = $('canvas')[0].getContext('2d'),
		width = $('canvas').width(), 
		x = width/2,
		height = $('canvas').height(), 
		y = height/4,
		coords = {"xPos":x, "yPos":y}; //default coordinates

	clearCanvas();
	
	//the initial black background
	function clearCanvas() {
		tile.fillStyle = "rgb(0,0,0)";
		tile.fillRect(0, 0, width, height);
	}
	
	//Define a tile object
	function Tiles(color, transparency) {
		this.color = color;
		this.inStack = {};
		this.tileSize = tSize;
		
		//find the index of the input coordinates in the tile array inStack
		this.whereInStack = function(posit) {	
			var tileStack;
			$.each(this.inStack, function(key, posits) {
				//console.log(key + ' '+ posit.toString()+ '---'+ posits.toString());
				for(var i = 0; i < posits.length; i ++) {
					//console.log((posits[i][0] == posit[0] && posits[i][1] == posit[1]));
					if(posits[i][0] == posit[0] && posits[i][1] == posit[1]) {
						tileStack = posits;
					}
				}
			});
			//console.log(posits.toString());
			if(!tileStack) {
				return false;
			} else {
				return tileStack;
			}
		};

		this.draw = function() {
		//	tile.globalAlpha = transparency;	
			tile.fillStyle = color;
			$.each(this.inStack, function(key, posits){
				for(var i = 0; i < posits.length; i ++) {	
					tile.fillRect(posits[i][0], posits[i][1], tSize, tSize);	
					tileOut.strokeRect(posits[i][0],  posits[i][1], tSize, tSize);
				}
				console.log(key);
			});
		};
	}

	//use this to keep track of the current dungeon tiles
	var dungeonStack = new Tiles('rgb(255,255,255)', 1);

	//Define a room tile object, which is a subset of tile
	//A room is a section of tiles that is at least 3 by 3 and 
	//is not connected to other tile sets that are at least 3 by 3. 
	function RoomTile() {
		/*Takes the positions of the corners of a 3 by 3 section of tiles and evaluates 
		* whether or not the input tile set is either an independent room or part of another room
		* Input: An array of [min x, min y, max x, max y] for a 3 by 3 segment of tiles
		*/
		this.inStack = [];
		this.tileSize = 3*tSize;
		this.whereInStack = function(corners) {
			for(var ind = 0; ind < this.inStack.length; ind ++) {
				//if(this.inStack[ind][4] == num) {
					var bool = ind;
					for(var j = 0; j < corners.length; j ++) {
						if(this.inStack[ind][j] != corners[j]) {
							bool = false;
						}
					}
					if(bool) {
						return bool;
					}
				//}
			}
			return false;
		};

		this.addToRooms = function(corners, counter, overlap) {
			var index, rooms;
			if(overlap) {
				rooms = overlap[0].subArr;
				index = overlap[0].end;
				corners.push(overlap[0].num);
				this.inStack.splice(index, 0, corners);
			} else {
				//counter ++;
				corners.push(counter);
				this.inStack.push(corners);
			}
			//console.log(roomStack.inStack.length);
		};

		this.findOverlaps = function(corners) {
			var room, num, end, overlaps=[], hasOverlap;
			for(var i = 0; i < this.inStack.length; i ++) {
				hasOverlap = false;
				room = this.inStack[i];
				num = room[4];
				end = i + 1;
				while(end < this.inStack.length && this.inStack[end][4] == num) {
					room.push(this.inStack[end]);
					if(roomsOverlap(this.inStack[end], corners, tSize)) {
						hasOverlap = true;
					}
					end++;

				}
				if(hasOverlap) {
					overlaps.push({subArr:room, end:end, num:num});
				}
				i = end; 
			}
			if(overlaps.length && overlaps[0]) {
				return overlaps;
			}
			return false;
		};

		this.draw = function() {
			tile.fillStyle = this.color;
			for(var i = 0; i < this.inStack.length; i ++) {	
				for(var x = this.inStack[i][0]; x < this.inStack[i][2]; x += tSize) {
					for(var y = this.inStack[i][1]; y < this.inStack[i][3]; y += tSize) {
						tile.fillRect(x, y, tSize, tSize);	
						tileOut.strokeRect(x, y, tSize, tSize);
					}
				}
			}

		};
	}

	//RoomTile inherits the properties of Tiles
	RoomTile.prototype = new Tiles('rgb(255,0,0)', 0.5);
	var roomStack = new RoomTile();
	var deadEndStack = new RoomTile();
	deadEndStack.color = 'rgb(255,255,255)';

	function roomsOverlap(room, corners, size) {
		//check the borders and make sure that rooms touching via their corrners don't count as one room
		return (!(room[0] > corners[2] || room[2] < corners[0] || room[1] > corners[3] || room[3] < corners[1]) && 
			(room[0] != corners[2] && (room[1] != corners[3] || room[3] != corners[1] )) && 
			(room[2] != corners[0] && (room[1] != corners[3] || room[3] != corners[1] )));
	}

	//pick a random point on the canvas to be the room center
	//if an array of rooms is passed through to the method then 
	//have the center be part of this rooom
	function getRoomCenter(size, roomArray) {
		var tempX, tempY, index;
		if(roomArray) {
			index = Math.round(Math.random()*(roomArray.length - 1));
			tempX = Math.floor(Math.random()*3)*size + roomArray[index][0];
			tempY = Math.floor(Math.random()*3)*size + roomArray[index][1];			
		}
		else { 
			tempX = Math.floor(Math.random()*(width/size-2))*size + size;
			tempY = Math.floor(Math.random()*(height/size-2))*size + size;
		}

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

	/*
	 * The current method of building rooms involves building them fully with the desired number of tiles. 
	 * To do so evenly, a "seed" must be placed from which the room can be built
	 */

	function placeRoomSeed(roomStack, roomCounter, size) {
		var center = getRoomCenter(size),
			corners = [center[0] - size, center[1] - size, center[0] + 2*size, center[1]+ 2*size],
			overlaps = roomStack.findOverlaps(corners);

		//Randomly pick room locations until you get one that doesn't overlap with naything
		while(overlaps) {
			center = getRoomCenter(size);
			corners = [center[0] - size, center[1] - size, center[0] + 2*size, center[1]+ 2*size];
			overlaps = roomStack.findOverlaps(corners);
		}

		roomStack.addToRooms(corners, roomCounter, overlaps);
	}
	/*will generate a 3 by 3 set of tiles and then will add it to the room tile stack
	*either as a room on its own or a part of another room
	*/
	function buildRoomv2(roomStack, roomCounter, size) {
		var center,
			corners,
			overlaps,
			roomMult = 2,
			currRoom = [roomStack.inStack[roomStack.inStack.length - 1]];
		//if there are no overlaps or if the potential room overlaps with more than one room, get another room
		for(var i = 0; i < roomMult; i ++) {	
			console.log('current Room: ' + currRoom.toString());
			center = getRoomCenter(size, currRoom);
			corners = [center[0] - size, center[1] - size, center[0] + 2*size, center[1] + 2*size];
			while(roomStack.whereInStack(corners)) {
				center = getRoomCenter(size, currRoom);
				corners = [center[0] - size, center[1] - size, center[0] + 2*size, center[1] + 2*size];
			}
			overlaps = roomStack.findOverlaps(corners);
			roomStack.addToRooms(corners, roomCounter, overlaps);
			corners.push(roomCounter);
			currRoom.push(corners);
		}		
	}

	function putRoomsInCanvas() {
		var Nrooms = $('#roomNum').val(),
			Ndeadends = $('#deadEnds').val(),
			center;
		roomCounter = 0;
		deadCounter = 0;
		tSize = 20;
		clearCanvas();
		roomStack.inStack = [];
		deadEndStack.inStack = [];

		for(roomCounter = 1; roomCounter <= Nrooms; roomCounter ++) {
			console.log('preparing to build');
			placeRoomSeed(roomStack,roomCounter, tSize);
			console.log('placed seed: ' + roomCounter+ ' at '+ roomStack.inStack[roomStack.inStack.length - 1].toString());
			buildRoomv2(roomStack, roomCounter, tSize);
			console.log('built room: ' + roomCounter);
		}
		while(deadCounter < Ndeadends) {
			center = getRoomCenter(tSize);
			var corners = [center[0], center[1], center[0] + tSize, center[1] + tSize];
			if(!deadEndStack.findOverlaps(corners) && !roomStack.findOverlaps(corners)) {
				deadEndStack.addToRooms(corners, roomCounter + deadCounter);
				deadCounter++;
			}
		}
		addHallways(roomCounter, deadCounter);
	}

	/*
	* Strategy: Turn the grid into a graph with height*width/(tileSize^2) vectors
	* pick two rooms and use an A* like algorithm to build the paths between rooms, this should also happen with deadends
	* pick a random spot on the room to be the beginning of the path
	*/	
	function addHallways(Nrooms, Ndeadends) {
		var points, 
			placeholder, 
			transitions = [],
			endPoints = roomStack.inStack;
		console.log(deadCounter);
		deadEndStack.inStack.forEach(function(dE) {
			endPoints.push(dE);
		});
		//console.log(endPoints.toString());
		dungeonStack.inStack = {}; 
		for(var i = 0; i < (Nrooms + Ndeadends)/2; i ++) {
			dungeonStack.inStack[i] = [];
			points = findStartandEnd(endPoints, i + 1, (Nrooms + Ndeadends - 1) - i);
			transitions.push(points);
			console.log(points.start.toString() + ' to ' + points.end.toString());
			placeholder = findMinPath(points.start, points.end, i);
			console.log(dungeonStack.whereInStack(points.start).toString());
			console.log('.................');
		}
		$.each(dungeonStack.inStack, function(key, value) {
			console.log(key);
		});
		completeDungeon(transitions, i);
		dungeonStack.draw();
		roomStack.draw();
		deadEndStack.draw();
	}

	function findStartandEnd(array, start, end) {
	//first grab a sub array of the rooms that have the room number of start
		var startRooms = [], startRoom, startCoords = [0,1], endRoom = [], endCoords = [0,1];
		array.forEach(function(room) {
			if(room[4] == start) {
				startRooms.push(room);
			}	
			//for now just grab the last room that has the right number, that should add a slight amount of
			//randomness to this dungeon formation process	
			if(room[4] == end) {
				endRoom = room;
			}
		});
		startRoom = startRooms[Math.round(Math.random() * (startRooms.length - 1))];
		//grab a random point here to be the starting point
		startCoords[0] = Math.floor(Math.random() * (startRoom[2] - startRoom[0])/tSize)*tSize + startRoom[0];
		startCoords[1] = Math.floor(Math.random() * (startRoom[3] - startRoom[1])/tSize)*tSize + startRoom[1];
		if(Math.abs(endRoom[0] - startCoords[0]) <= Math.abs(endRoom[2] - startCoords[0] - tSize)) {
			endCoords[0] = endRoom[0];
		} else {
			endCoords[0] = endRoom[2];
		}
	
		if(Math.abs(endRoom[1] - startCoords[1]) <= Math.abs(endRoom[3] - startCoords[1] - tSize)) {
			endCoords[1] = endRoom[1];
		} else {
			endCoords[1] = endRoom[3];
		}
		return {start: startCoords, end: endCoords};
	}		

	//A-like graphing algorithm
	//I don't do much with the returned value yet, might come up with something later
	//ATM I am keeping it in to keep the recursive algorithm
	function findMinPath(path, goal, num) {
		var tempX = path[0], 
			tempY = path[1],
			randNum = Math.round(Math.random());
		dungeonStack.inStack[num].push(path);
		if(path[0] == goal[0] && path[1] == goal[1]) {
			return path;
		}
		switch(randNum) {
			case 0: {
				if(tempX > goal[0]) {
					tempX -= tSize;
					break;
				} else  if (tempX < goal[0]) {
					tempX += tSize;
					break;
				} else {
					randNum = 1;
				}
			}

			case 1: {
				if(tempY > goal[1]) {
					tempY -= tSize;
					break;
				} else  if (tempY < goal[1]) {
					tempY += tSize;
					break;
				} else {
					randNum = 0;
				}
			}
		}
		return findMinPath([tempX, tempY], goal, num);
	}	

	//develop an algorithm to check if the halls are indeed connected,
	//for this assume that halls connecting rooms are straight lines and see if those
	//lines intercept within the bounds of the end points of either hallway
	function completeDungeon(points, numCrossHall) {
		var x1, 
			x2, 
			y1, 
			y2, 
			m1,
			m2, 
			cross, 
			j=0,
			minLength,
			minPath; 

		for(var i = 0; i < points.length; i ++) {
			//properties of a straight line
			x1 = points[i].start[0];
			y1 = points[i].start[1];
			m1 = (points[i].end[1] - y1)/(points[i].end[0] - x1);
			console.log(i + 'th path has eqn: y = '+ m1 +'*(x - '+x1+') + '+ y1);
			cross = false;
			minLength = 100000;
			for(j = i + 1; j < points.length; j ++) {
				x2 = points[j].start[0];
				y2 = points[j].start[1];
				m2 = (points[j].end[1] - y2)/(points[j].end[0] - x2);
				//check to make sure the indices aren't the same so we don't get a divis by 0 exception
				var xint = ((y2 - y1) + m1*x1 - m2*x2)/(m1 - m2),
					yint;
				if(xint == Infinity) {
					continue;
				}
				yint = m1*(xint - x1) + y1;
				if(((xint <= x1 && xint >= points[i].end[0]) || (xint >= x1 && xint <= points[i].end[0])) && 
					((yint <= y1 && yint >= points[i].end[1]) || (yint >= y1 && yint <= points[i].end[1]))&& 
					((xint <= x2 && xint >= points[j].end[0]) || (xint >= x2 && xint <= points[j].end[0]))&& 
					((yint <= y2 && yint >= points[j].end[1]) || (yint >= y2 && yint <= points[j].end[1]))) {
					//closestPoints(points[i], points[j]);
					console.log(i + ' intercepts ' + j + ' at ' + xint +', ' + yint);
					cross = true;
				}
				else {
					var minData = minDistance(points[i].start, points[j].start);
					if(minLength > minData.dist) {
						minPath = {start:minData.start, end:minData.end};
						minLength = minData.dist;
					}
				}
				if(!cross) {
					numCrossHall ++;
					dungeonStack.inStack[numCrossHall] = [];
					var	placeholder = findMinPath(minPath.start, minPath.end, numCrossHall);
				}
			}
		}
	}

	function isBetween(midpoint, point1, point2) {
		return ((midpoint <= point1 && midpoint >= point2) || (midpoint >=point1 && midpoint <= point2));
	}

	function minDistance (path1, path2) {
		var points1,
			points2,
			min = 10000000,
			minStart, 
			minEnd;
		
		points1 = dungeonStack.whereInStack(path1);
		points2 = dungeonStack.whereInStack(path2);
		//onsole.log(points1.toString() + '....' + points2.toString());
		for(var i = 0; i < points1.length; i ++) {
			for(var j = 0; j < points2.length; j ++) {
				if(min > pythagoras(points1[i], points2[j])) {
					min = pythagoras(points1[i], points2[j]);
					minStart = points1[i];
					minEnd = points2[j];
				}
			}
		}

		return {dist: min, start: minStart, end: minEnd};
	}

	//the pythagorean theorem which is used to get the distance between two points.
	function pythagoras(pos1, pos2) {
		return Math.sqrt(Math.abs((pos1[0] - pos2[0])*(pos1[0] - pos2[0]) + (pos1[1] - pos2[1])*(pos1[1] - pos2[1])));
	}

	//BFS to find the nearest dungeon tile
	//currently not used, but I'm keeping it for now.
	function getClosestTile(x, y) {
		//implement a queue using an array, add to one side and remove from the other
		var queue = [{x:x, y:y}];
		while(!queue[0]) {
			var temp = queue.splice(0,0);
			if(dungeonStack.whereInStack(temp)) {
				return temp;
			}
			queue.push({x: temp.x + tSize, y: temp.y});
			queue.push({x: temp.x - tSize, y: temp.y});
			queue.push({x: temp.x, y: temp.y + tSize});
			queue.push({x: temp.x, y: temp.y - tSize});
		} 
		return [x,y];
	}

	function isInBounds(posit){
		var x = posit[0],
			y = posit[1];
		return (x >= 15 && x <= width - 20 && y >= 15 && y <= height - 20);
	}

	$('#room2').click(function() {
		putRoomsInCanvas();
	});

});