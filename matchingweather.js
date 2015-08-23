	
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
	var heatmap;
	
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
			url: "http://similar.city/datav3/core_city_data.csv",
			dataType: 'text',
			encoding:"UTF-8",
			success: function( data) {
				//console.log(data);
				
				var lines = data.split("\n");
				//console.log(lines[4]);
				
				for (var i = 1; i < lines.length; i++) { // skip first line
					var values = lines[i].split("|");
					//console.log(values[0]);
					
					if (values[5] === undefined || values[6] === undefined || values[11] === undefined || values[14] === undefined) {
						console.log('Missing data for city ' + values[0] + ' (index: ' + i + ')');
						continue;
					}
					var rainfall = parseInt(values[14]);
					if (rainfall == 0) continue;
					
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

					createMarker(lat, lng, cityInfo, -1, true); // -1 means no score		
					
				}			
				
				selectCity("Barcelona", false, false);

			},
			error: function( data, textStatus, errorThrown ) {
				console.log('textStatus: ' + textStatus + ', errorThrown: ' + errorThrown + ', ERROR: ', data );
			}
		});
	}

	var markerImages = [];
	
	// pass in a number from 1-10
	function createMarkerImage(size, type, selectedCity, fixedSize) {
		try {
			size = parseFloat(size);
			if (size > 10) console.log('Error creating marker image with size ' + size);
			else if (size < 0) console.log('Error creating marker image with size ' + size);
			
			if (markerImages[size] != null) return markerImages[size];
			
			var imageSize = size * 3;
			
			var imageUrl;

			if (fixedSize) {
				imageUrl = 'images/marker-transparent.png';
			} else {
				if (selectedCity) {
					imageUrl = 'images/marker-selected.png';
					imageSize = imageSize *2;
				} else if (size >= 9.5) {
					imageUrl = 'images/marker-10.png';
				} else if (size >= 9) {
					imageUrl = 'images/marker-9.png';
				} else if (size >= 8.5) {
					imageUrl = 'images/marker-8.png';	
				} else if (size >= 8) {
					imageUrl = 'images/marker-7.png';
				} else if (size >= 7) {
					imageUrl = 'images/marker-6.png';
				} else if (size >= 6) {
					imageUrl = 'images/marker-5.png';
				} else if (size >= 5) {
					imageUrl = 'images/marker-4.png';
				} else if (size >= 4) {
					imageUrl = 'images/marker-3.png';
				} else {
					imageUrl = 'images/marker-low.png';
				} 
			}
			
			size = parseInt(size);
			
			var markerImage = {
				url: imageUrl,
				// This marker is 20 pixels wide by 32 pixels tall.
				size: new google.maps.Size(50, 50),
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
	function createMarker(lat, lng, cityInfo, similarityScore, fixedSize) {
	 
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
		renderScore(similarityScore) +
		'</div>';

		var infowindow = new google.maps.InfoWindow({
			content: contentString
		});
		
		// pass a value between 1-10 to scale marker
		
		var size;
		if (fixedSize)
			similarityScore = 20; // fix the size, remove this for dynamic sizing (15 August)
		
		if (similarityScore === undefined || similarityScore < 0) {
			size = 3;
		} else {
			size = similarityScore / 10;
		}
		
		if(cityInfo.key == selectedCity) {
			var image = createMarkerImage(size, cityInfo.type, true, fixedSize);
		} else {
			var image = createMarkerImage(size, cityInfo.type, false, fixedSize);
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
	
	function renderScore(similarityScore) {
		var html = "";
		
		html = html + "<span class='similarityScore'><span class='val'>" + similarityScore + "</span></span>";
		
		return html;
	}
	
	function tempFactsHTML(aht, ahtMax, ahtMin, arTotal) {
		if (!isNumeric(aht)) aht = "";
		if (!isNumeric(ahtMax)) ahtMax = "";
		if (!isNumeric(ahtMin)) ahtMin = "";
		if (!isNumeric(arTotal)) arTotal = "";
		
		aht = Math.round(aht);
		ahtMax = Math.round(ahtMax);
		ahtMin = Math.round(ahtMin);
		arTotal = Math.round(arTotal);
		
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
		
		var ref = this.id.split('__')[1];
		$(".btnSelectCity").click(function() {
			//var ref = this.id.split('__')[1];
			selectCity(ref, false, true);
			
		});
		
		$(".btnWikipedia").click(function() {
			//var ref = this.id.split('__')[1];
			window.open("https://en.wikipedia.org/wiki/" + ref + "#Climate", '_blank');
		});
		
		var similarityScore = parseInt($(".similarityScore .val").text());
		if (similarityScore > 0) {
			$(".similarityScore").show();
			$(".similarityScore").css("background-color", getScoreCircleColor(similarityScore));
			$(".similarityScore").css("color", getScoreCircleColorFont(similarityScore));
			if (similarityScore >= 100)
				$(".similarityScore .val").css("left", "6px");
			else 
				$(".similarityScore .val").css("left", "10px");
		} else {
			$(".similarityScore").hide();
		}
		
		$("#btnSelectCity__" + selectedCity).prop("disabled",true);
		
		if (getParameterByName("debug") != "true") {
			//ga('send', 'event', 'category', 'action', 'label');
			ga('send', 'event', 'City Info', 'Info Popup', ref);
		}		
	}
	
	function getScoreCircleColor(similarityScore) {
			if (similarityScore >= 95) {
				return "#ed1c1c";
			} else if (similarityScore >= 90) {
				return "#ed1c1c";
			} else if (similarityScore >= 85) {
				return "#ed531c";	
			} else if (similarityScore >= 80) {
				return "#ed8d1c";
			} else if (similarityScore >= 70) {
				return "#edbf1c";
			} else if (similarityScore >= 60) {
				return "#ebed1c";
			} else if (similarityScore >= 50) {
				return "#baed1c";
			} else if (similarityScore >= 40) {
				return "#c1f030";
			} else if (similarityScore >= 30) {
				return "#a3bd50";	
			} else {
				return "#898989";
			} 
	}
	
	function getScoreCircleColorFont(similarityScore) {
			if (similarityScore >= 95) {
				return "white";
			} else {
				return "black";
			} 
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
	var heatmapMode = false;
	
	var africaMatches = {};
	var asiaMatches = {};
	var europeMatches = {};
	var naMatches = {};
	var saMatches = {};
	
	var cityViewCount = 0;
	
	// pass in array of google.maps.LatLng(37.782551, -122.445368)
	function initHeatmap(data) {
		heatmap = new google.maps.visualization.HeatmapLayer({
			data: getPoints(),
			map: map
		});
	}

	function selectCity(cityRef, displayInfoWindow, displayMatchWindow) {
		var cityInfo = citiesByRef[cityRef];
		var cityName = cityInfo.name.split(",")[0];
		$("#selectedCityName").html(cityName);
		selectedCity = cityInfo.key;
		cityViewCount = cityViewCount + 1;
		
		if (getParameterByName("debug") != "true") {
			//ga('send', 'event', 'category', 'action', 'label');
			ga('send', 'event', 'Select City', 'Select City', cityRef, cityViewCount);
		}
		
		var cityCol = parseInt(cityInfo.cityCol);
		cityCol = cityCol+1;
		
		$.ajax({
			url: "http://similar.city/datav3/disk" + cityCol + ".csv",
			dataType: 'text',
			encoding:"UTF-8",
			success: function( data) {
				//console.log(data);
				clearMarkers();
				africaMatches = {};
				asiaMatches = {};
				europeMatches = {};
				naMatches = {};
				saMatches = {};
				
				var values = data.split("|"); // single row of weather similarity scores, split by pipe delimiter
				
				var heatmapPoints = [];
				
				for (var i = 1; i < values.length; i++) { // skip first line
					compareCityInfo = citiesByIndex[i]; // grab the comparison city, pre-populated earlier with the matching index from the City_Col_Index column
					if (compareCityInfo !== undefined) { // we have found a city match result
						compareCityInfo.score = values[i];
						//createMarker(compareCityInfo.lat, compareCityInfo.lng, compareCityInfo, values[i]);	
						
						if (heatmapMode) {
							createMarker(compareCityInfo.lat, compareCityInfo.lng, compareCityInfo, values[i], true); // fixed size marker
							var weight = values[i] / 10;
							heatmapPoints[i] = {location: new google.maps.LatLng(compareCityInfo.lat, compareCityInfo.lng), weight: weight};
						} else {
							createMarker(compareCityInfo.lat, compareCityInfo.lng, compareCityInfo, values[i], false); // fixed size marker
						}
							
						if (compareCityInfo.region == "Africa" || compareCityInfo.region == "Middle East") {
							groupRegionCounter(africaMatches, compareCityInfo, values[i])
						} else if (compareCityInfo.region == "South-East Asia" || compareCityInfo.region == "North-East Asia" || compareCityInfo.region == "South Asia" || compareCityInfo.region == "Russia & Central Asia" || compareCityInfo.region == "Pacific") {
							groupRegionCounter(asiaMatches, compareCityInfo, values[i])
						} else if (compareCityInfo.region == "Europe") {
							groupRegionCounter(europeMatches, compareCityInfo, values[i])
						} else if (compareCityInfo.region == "North America") {
							groupRegionCounter(naMatches, compareCityInfo, values[i])
						} else if (compareCityInfo.region == "South America") {
							groupRegionCounter(saMatches, compareCityInfo, values[i])
						}
					}
				}
				if (heatmapMode) {
					heatmap = new google.maps.visualization.HeatmapLayer({
						data: heatmapPoints,
						dissipating: true,
						maxIntensity: 10,
						radius: 15,
						radius: 15,
						map: map
					});
				}
				
				$('#cityMatchInfo').prop("disabled",false);
				
				if (displayInfoWindow) {
					openInfoWindowAndBind(cityInfo.infowindow, cityInfo.marker);
				} else if (displayMatchWindow) {
					openMatchInfo(selectedCity); // all cities loaded, now can open match window
				}
			},
			error: function( data, textStatus, errorThrown ) {
				console.log('textStatus: ' + textStatus + ', errorThrown: ' + errorThrown + ', ERROR: ', data );
			}
		});		
		
	}
	
	function groupRegionCounter(regionMatchingObject, compareCityInfo, score) {
		var cityGroup = []; // create new score grouping array, use later if needed
		if (regionMatchingObject[score] != null) {
			cityGroup = regionMatchingObject[score]; // if array has previously been created, grab the old one
		}
		if (compareCityInfo.key != selectedCity)
			cityGroup.push(compareCityInfo); // push city with score to array
		regionMatchingObject[score] = cityGroup; // update matches object with grouping array
		//console.log('Added ' + compareCityInfo.name + ' to African counter with score ' + score);
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
	  
	function createCityMatchRow(cityInfo, prefix, rowNumber) {
		$('#' + prefix + 'Row' + rowNumber).html('<td class="mdl-data-table__cell--non-numeric">' + cityInfo.name +'</td><td>' + cityInfo.score +'</td><td style="display:none;" id="' + prefix + 'Row' + rowNumber + 'Key">' + cityInfo.key +'</td>');
	}
	
	function findTopMatches(regionArray, regionName) {
		var limit = 3; // max 3 per region
		var found = [];
		//if (region == "africa") {
			for (var i=100; i > 0; i--) {
				cityGroup = regionArray[i];
				if (cityGroup != null) {
					for (var j=0; j<cityGroup.length; j++) {
						cityInfo = cityGroup[j];
						found.push(cityInfo);
						createCityMatchRow(cityInfo, regionName, found.length)
						if (found.length > 3) {
							return found;
						}
					}
				}
			}
		//}
	}
	
	/**
	 * Selects a city and centres map, based on cityInfo object
	 * passed in as a parameter
	 */
	function openCity(cityInfo) {
		var infowindow = cityInfo.infowindow;
		var marker = cityInfo.marker;
		selectCity(cityInfo.key, false, true);
		var latLng = marker.getPosition(); // returns LatLng object
		map.setCenter(latLng); // setCenter takes a LatLng object
		//openMatchInfo(cityInfo.key);
	}
	
	function openMatchInfo(cityKey) {
		$("#welcomeCard").hide();
		var cityInfo = citiesByRef[selectedCity];
		$('#cityName').html(cityInfo.name);
		findTopMatches(africaMatches, "africa");
		findTopMatches(asiaMatches, "asia");
		findTopMatches(europeMatches, "europe");
		findTopMatches(naMatches, "na");
		findTopMatches(saMatches, "sa");
		$(".matchInfoAsia.data").hide();
		$(".matchInfoAfrica.data").hide();
		$(".matchInfoEurope.data").hide();
		$(".matchInfoNA.data").hide();
		$(".matchInfoSA.data").hide();
		$('#matchInfo').fadeIn();
	}
	
	/**
	 * Gets a querystring parameter
	 */
	function getParameterByName(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(location.search);
		return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}
	  
	$( document ).ready(function() {
		$('.cityRow').click(function() {
			var row = $(this).attr('id');
			$("#" + row + "Key").text();
			var clickedKey = $("#" + row + "Key").text();
			var cityInfo = citiesByRef[clickedKey];
			
			$('#matchInfo').fadeOut();
			openCity(cityInfo);
			
			
			//console.log(row + " | "+ $("#" + row + "Key").text());
		});
		
		$('#cityMatchInfo').prop("disabled",true);
		
		$('#cityMatchInfo').click(function() {
			if (getParameterByName("debug") != "true") {
				//ga('send', 'event', 'category', 'action', 'label');
				ga('send', 'event', 'City Info', 'Match Info of Selected City', selectedCity);
			}		
			openMatchInfo(selectedCity);
		});
	
		$("#matchInfoClose").click(function() {
			$('#matchInfo').fadeOut();
		});
	
		$(".matchInfoAsia.header").click(function() {
			$(".matchInfoAsia.data").toggle();
			$(".matchInfoAfrica.data").hide();
			$(".matchInfoEurope.data").hide();
			$(".matchInfoNA.data").hide();
			$(".matchInfoSA.data").hide();
		});
		
		$(".matchInfoAfrica.header").click(function() {
			$(".matchInfoAsia.data").hide();
			$(".matchInfoAfrica.data").toggle();
			$(".matchInfoEurope.data").hide();
			$(".matchInfoNA.data").hide();
			$(".matchInfoSA.data").hide();			
		});
		
		$(".matchInfoEurope.header").click(function() {
			$(".matchInfoAsia.data").hide();
			$(".matchInfoAfrica.data").hide();
			$(".matchInfoEurope.data").toggle();
			$(".matchInfoNA.data").hide();
			$(".matchInfoSA.data").hide();			
		});
		
		$(".matchInfoNA.header").click(function() {
			$(".matchInfoAsia.data").hide();
			$(".matchInfoAfrica.data").hide();
			$(".matchInfoEurope.data").hide();
			$(".matchInfoNA.data").toggle();
			$(".matchInfoSA.data").hide();			
		});
		
		$(".matchInfoSA.header").click(function() {
			$(".matchInfoAsia.data").hide();
			$(".matchInfoAfrica.data").hide();
			$(".matchInfoEurope.data").hide();
			$(".matchInfoNA.data").hide();
			$(".matchInfoSA.data").toggle();		
		});
	
	});