	
//	36°57'9" N  = 36.9525000
//	110°4'21" W = -110.0725000

	// convert from old-school lat/long to decimal
	function ConvertDMSToDD(degrees, minutes, seconds, direction) {
		var dd = parseInt(degrees) + parseInt(minutes)/60 + parseInt(seconds)/(60*60);

		if (direction == "S" || direction == "W") {
			dd = parseFloat(dd) * -1;
		} // Don't do anything for N or E
		return dd;
	}
	
	//Expects [31°0\'18.0\" N], without square brackets 
	function ParseDMS2(input) {
		//var parts = input.split(/[^\d\w]+/);
		if (input != null && input !== undefined) {
			if (input.charAt(0) == "\"" && input.charAt(input.length -1) == "\"") {
				input = input.substr(1, input.length -2);
				
				input = input.replace("\"\"", "\"");
			}
			
			var split = input.split('\" '); // break off direction
			var direction = split[1];
			var split = split[0].split("\'"); // break off seconds
			var seconds = split[1];
			//console.log('degrees: ' + split[0] + ', ' + split[1] + '. match degree symbol: ' + split[0].match('\u00B0'));
			var split = split[0].split("\u00B0"); // break off minutes // THIS DEGREES SYMBOL DIDN'T WORK ON HOSTED VERSION ?
			var minutes = split[1];
			var degrees = split[0];
			
			var parsed = ConvertDMSToDD(degrees, minutes, seconds, direction);
			
			return parsed;
			
		}
		

	}

	var parts = '31°0\'18.0\" N 121°24\'32.4\" E'.split(/[((°|'|(\"\s)|\s)\s)]/);
		
	var map;  
	
	google.maps.event.addDomListener(window, 'load', initialize);
	  
    function initialize() {
		//gapi.client.setApiKey('AIzaSyBG-MEa5wcsXp24h7h03mhSPQl2bN5gmRM');
        
	
        var mapCanvas = document.getElementById('map-canvas');
        var mapOptions = {
          center: new google.maps.LatLng(20.258028, 13.959507),
          zoom: 2,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        }
        map = new google.maps.Map(mapCanvas, mapOptions)
		console.log( "ready in map initialise!" );
		
		
		google.maps.event.addListenerOnce(map, 'idle', function(){
			// do something only the first time the map is loaded
			console.log( "map has initialised!" );
			
			//gapi.client.load('urlshortener', 'v1').then(getMarkers);
			getMarkers();
		});

    }
	
	function trimResponse(response) {
		var trimmed = response.replace("google.visualization.Query.setResponse(", "");
		trimmed = trimmed.replace(");", "");
		return trimmed;
	}


	function getMarkers() {
	
		$.ajax({
			//type:"GET", // access control issue if using POST
			//url: "data/core_city_data.csv",
			url: "http://johnellliott.github.io/data/core_city_data.csv",
			dataType: 'text',
			encoding:"UTF-8",
			success: function( data) {
				//console.log(data);
				
				var lines = data.split("\n");
				//console.log(lines[4]);
				
				for (var i = 1; i < lines.length; i++) { // skip first line
					var values = lines[i].split("|");
					//console.log(values[0]);
					
					var lat = values[5]; //'31°0\'18.0\" N' 
					var lng = values[6]; //'121°24\'32.4\" E'
					
					lat = ParseDMS2(lat);
					lng = ParseDMS2(lng);
					
					var cityInfo = {
						key: values[0],
						name: values[1],
						region: values[2],
						altitude: values[3],
						country: values[4],
						type: values[7], // 1=Alpha city, 2=normal city, 3=POI
						notes: values[8],
						cityCol: values[9], // the column in the CSV row data that is associated with this city
						aht: values[11],
						ahtMax: values[12],
						ahtMin: values[13],
						arTotal: values[14],
						lat: lat,
						lng: lng,
					}
					
					citiesByRef[cityInfo.key] = cityInfo;
					citiesByIndex[cityInfo.cityCol] = cityInfo;



					createMarker(lat, lng, cityInfo, -1); // -1 means no score		
				}			

			},
			error: function( data, textStatus, errorThrown ) {
				console.log('textStatus: ' + textStatus + ', errorThrown: ' + errorThrown + ', ERROR: ', data );
			}
		});
	}

	var markerImages = [];
	
	// pass in a number from 1-10
	function createMarkerImage(size, type, selectedCity) {
		try {
			size = parseFloat(size);
			if (size > 10) console.log('Error creating marker image with size ' + size);
			else if (size < 0) console.log('Error creating marker image with size ' + size);
			
			if (markerImages[size] != null) return markerImages[size];
			
			var imageSize = size * 3;
			
			var imageUrl;

			if (selectedCity) {
				imageUrl = 'images/marker-selected.png';
				imageSize = imageSize *2;
			} else if (size >= 9.5) {
				imageUrl = 'images/marker-10.png';
			} else if (size >= 9) {
				imageUrl = 'images/marker-9.png';
			} else if (size >= 8) {
				imageUrl = 'images/marker-7.png';
			} else if (size >= 7) {
				imageUrl = 'images/marker-6.png';
			} else if (size >= 6) {
				imageUrl = 'images/marker-5.png';
			} else if (size >= 5) {
				imageUrl = 'images/marker-4.png';
			} else if (size >= 4) {
				imageUrl = 'images/marker-4.png';
			} else {
				imageUrl = 'images/marker-low.png';
			} 
			
			size = parseInt(size);
			
			var markerImage = {
				url: imageUrl,
				// This marker is 20 pixels wide by 32 pixels tall.
				//size: new google.maps.Size(30, 30),
				// The origin for this image is 0,0.
				origin: new google.maps.Point(0, 0),
				// Make this half of the size
				anchor: new google.maps.Point(imageSize/2, imageSize/2),
				
				scaledSize: new google.maps.Size(imageSize, imageSize)
			};
			
			markerImages[size] = markerImage;
			
			return markerImage;
		} catch(err) {
			console.log('Error creating marker image with size ' + size + '. Error: ' + err);
		}
	}
	
	/* Initialize a blank array to store all the markers
	 * that we're going to place on the map
	 */
	var markers = [];
	var markersByCityKey = {};
	 
	/* Function takes in a latitude and longitude coordinate
	 * and constructs a marker object, then pushes it on
	 * the marker array we just created.
	 */
	function createMarker(lat, lng, cityInfo, similarityScore) {
	 
		var lol = new google.maps.LatLng(lat, lng);
		
		var contentString = 
		'<div class="markerPopup">' +
		'<h1 class="popupHeading">' + cityInfo.name + '</h1>' +
		'<div id="bodyContent">' + 
		'<p class="country">' + cityInfo.country + '</p>' + 
		'<p>' + cityInfo.notes + '</p>' +
		tempFactsHTML(cityInfo.aht, cityInfo.ahtMax, cityInfo.ahtMin, cityInfo.arTotal) + 
		'<div>' +
		'<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent btnSelectCity" id="btnSelectCity__' + cityInfo.key + '">' +
		'Select City' +
		'</button>' +
		'&nbsp;' +
		'<button class="mdl-button mdl-js-button mdl-button--primary btnWikipedia" style="float:right;" id="btnWikipedia__' + cityInfo.key + '">' +
		'Wikipedia' +
		'</button>' +
		'</div>' +
		'</div>' +
		'</div>';

		var infowindow = new google.maps.InfoWindow({
			content: contentString
		});
		
		// pass a value between 1-10 to scale marker
		
		var size;
		
		if (similarityScore === undefined || similarityScore < 0) {
			size = 3;
		} else {
			size = similarityScore / 10;
		}
		
		if(cityInfo.key == selectedCity) {
			var image = createMarkerImage(size, cityInfo.type, true);
		} else {
			var image = createMarkerImage(size, cityInfo.type, false);
		}
	 
		var marker = new google.maps.Marker({
			position: lol,
			icon: image,
			map: map,
			visible: true//,
			//label: cityInfo.name
		});
		
		cityInfo.marker = marker;
		cityInfo.infowindow = infowindow;
		
		google.maps.event.addListener(marker, 'click', function() {
			openInfoWindowAndBind(infowindow, marker);
		});

		markers.push(marker);
		markersByCityKey[cityInfo.key] = marker;
	}
	
	function tempFactsHTML(aht, ahtMax, ahtMin, arTotal) {
		if (!isNumeric(aht)) aht = "";
		if (!isNumeric(ahtMax)) ahtMax = "";
		if (!isNumeric(ahtMin)) ahtMin = "";
		if (!isNumeric(arTotal)) arTotal = "";
		
		var html = "<div class='weatherFacts'>";
		html = html + "<div><span class='tempFactLabel'>";
		html = html + "Mean daytime (°C):";
		html = html + "</span>";
		html = html + "<span class='tempFactValue' style='background-color:" + getTempColour(aht) + "'>";
		html = html + aht;
		html = html + "</span></div>";
		
		html = html + "<div><span class='tempFactLabel'>";
		html = html + "Max. daytime (°C):";
		html = html + "</span>";
		html = html + "<span class='tempFactValue' style='background-color:" + getTempColour(ahtMax) + "'>";
		html = html + ahtMax;
		html = html + "</span></div>";

		html = html + "<div><span class='tempFactLabel'>";
		html = html + "Min. daytime (°C):";
		html = html + "</span>";
		html = html + "<span class='tempFactValue' style='background-color:" + getTempColour(ahtMin) + "'>";
		html = html + ahtMin;
		html = html + "</span></div>";

		html = html + "<div><span class='tempFactLabel'>";
		html = html + "Annual rainfall (mm):";
		html = html + "</span>";
		html = html + "<span class='tempFactValue' style='background-color:" + getRainColour(arTotal) + "'>";
		html = html + arTotal;
		html = html + "</span></div>";		
		
		html = html + "</div>";
		
		return html;
	}
	
	/**
	 * Gets an HTML colour for a specified temperature (in celsius)
	 */
	function getTempColour(temp) {
		if (temp > 35) return "#ff0000";
		else if (temp > 30) return "#ff4800";
		else if (temp > 25) return "#ff8400";
		else if (temp > 20) return "#ffd200"; // orange
		else if (temp > 15) return "#deff00"; // orange yellow
		else if (temp > 10) return "#aeff00"; // yellow-green
		else if (temp > 5) return "#0cff00"; // green
		else if (temp > 0) return "#00ff72"; // green-blue
		else if (temp > -5) return "#00ffd8";
		else if (temp > -10) return "#00c6ff";
		else if (temp > -20) return "#007eff";
		else if (temp > -30) return "#001eff";
	}
	
	/**
	 * Gets an HTML colour for a specified rainfall (in mm)
	 */
	function getRainColour(rainfall) {
		if (rainfall > 3000) return "#359a32";
		else if (rainfall > 2500) return "#47b244";
		else if (rainfall > 2000) return "#4fbd4c";
		else if (rainfall > 1500) return "#5bc958"; // orange
		else if (rainfall > 1000) return "#6edc6b"; // orange yellow
		else if (rainfall > 700) return "#86ed84"; // yellow-green
		else if (rainfall > 500) return "#99f597"; // green
		else if (rainfall > 250) return "#b5fbb3"; // green-blue
		else if (rainfall >= 0) return "#daffd9";
	}	
	
	function isNumeric(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	function openInfoWindowAndBind(infowindow, marker) {
		infowindow.open(map,marker);
		$(".btnSelectCity").click(function() {
			var ref = this.id.split('__')[1];
			selectCity(ref, false);
		});
		
		$(".btnWikipedia").click(function() {
			var ref = this.id.split('__')[1];
			window.open("https://en.wikipedia.org/wiki/" + ref + "#Climate", '_blank');
		});
		
		$("#btnSelectCity__" + selectedCity).prop("disabled",true);
	}
	
	// Sets the map on all markers in the array.
	function setAllMap(map) {
	  for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(map);
	  }
	}

	// Removes the markers from the map, but keeps them in the array.
	function clearMarkers() {
	  setAllMap(null);
	}

	// Shows any markers currently in the array.
	function showMarkers() {
	  setAllMap(map);
	}

	// Deletes all markers in the array by removing references to them.
	function deleteMarkers() {
	  clearMarkers();
	  markers = [];
	}

	var citiesByRef = {}; // uses key e.g. Kuala_Lumpur
	var citiesByIndex = {}; // uses numeric index for city key e.g. 231
	var selectedCity;

	function selectCity(cityRef, displayInfoWindow) {
		var cityInfo = citiesByRef[cityRef];
		$("#selectedCityName").html(cityInfo.name);
		selectedCity = cityInfo.key;
		
		var cityCol = parseInt(cityInfo.cityCol);
		cityCol = cityCol+1;
		
		$.ajax({
			url: "http://johnellliott.github.io/data/disk" + cityCol + ".csv",
			dataType: 'text',
			encoding:"UTF-8",
			success: function( data) {
				//console.log(data);
				clearMarkers();
				var values = data.split("|"); // single row of weather similarity scores, split by pipe delimiter
				
				for (var i = 1; i < values.length; i++) { // skip first line
					compareCityInfo = citiesByIndex[i]; // grab the comparison city, pre-populated earlier with the matching index from the City_Col_Index column
					createMarker(compareCityInfo.lat, compareCityInfo.lng, compareCityInfo, values[i]);	
				}
				
				if (displayInfoWindow) {
					openInfoWindowAndBind(cityInfo.infowindow, cityInfo.marker);
				}
			},
			error: function( data, textStatus, errorThrown ) {
				console.log('textStatus: ' + textStatus + ', errorThrown: ' + errorThrown + ', ERROR: ', data );
			}
		});		
		
	}
	
	/* Function takes in the Bench ID and caption we constructed
	 * in $.getJSON's callback function, then creates an InfoWindow
	 * object and displays it on the map.
	 */
	function createInfoWindow(id, contentString) {
		var infowindow = new google.maps.InfoWindow({
			content: contentString
		});
	 
		google.maps.event.addListener(markers[id], 'click', function() {
			infowindow.open(map,markers[id]);
		}); 
	}
	  