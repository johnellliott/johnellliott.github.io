	
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
	
	
	  
    function initialize() {
		//gapi.client.setApiKey('AIzaSyBG-MEa5wcsXp24h7h03mhSPQl2bN5gmRM');
        
	
        var mapCanvas = document.getElementById('map-canvas');
        var mapOptions = {
          center: new google.maps.LatLng(20.258028, 13.959507),
          zoom: 2,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
		  panControl: false,

			mapTypeControl: true,
			mapTypeControlOptions: {
				style: google.maps.MapTypeControlStyle.DEFAULT ,
				position: google.maps.ControlPosition.RIGHT_BOTTOM
			},
			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.DEFAULT,
				position: google.maps.ControlPosition.LEFT_CENTER
			},
			scaleControl: false,
			streetViewControl: false

        }
        map = new google.maps.Map(mapCanvas, mapOptions)

		map.addListener('maptypeid_changed', function() {
			//infowindow.setContent('Zoom: ' + map.getZoom());
			console.log('type change' + map.getMapTypeId());
			if (map.getMapTypeId() == "hybrid" || map.getMapTypeId() == "satellite") {
				$(".je-city-name-small-screen-title").css("color", "white");
				$(".mdl-layout__drawer-button .material-icons").css("color","white");
			} else {
				$(".je-city-name-small-screen-title").css("color", "#757575");
				$(".mdl-layout__drawer-button .material-icons").css("color","#757575");
			}
		});
		
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
	
		var coreCityDataSource;
		
		if (getParameterByName("debug") == "true") {
			coreCityDataSource = "core_city_data.csv";
		} else {
			coreCityDataSource = "http://similar.city/core_city_data.csv";
		}
	
		$.ajax({
			//type:"GET", // access control issue if using POST
			//url: "data/core_city_data.csv",
			url: coreCityDataSource,
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
						population: values[16],
						gdpCapita: values[17],
						lat: lat,
						lng: lng,
						number: i
					}
					
					citiesByRef[cityInfo.key] = cityInfo;
					citiesByIndex[cityInfo.cityCol] = cityInfo;
					cityIndexByKeys[cityInfo.key] = cityInfo.cityCol;

					createMarker(lat, lng, cityInfo, -1, true); // -1 means no score		
					
				}			
				
				console.log(getParameterByName("city").length);
				
				if (getParameterByName("city").length > 0) { 
					selectCity(getParameterByName("city"), false, false);
					
					if (getParameterByName("comparison").length > 0) { 
						//compareCityByKey(getParameterByName("comparison"))
						comparisonCity = getParameterByName("comparison");
					}
				} else {
					selectCity("Barcelona", false, false);
					//compareCityByKey("Berlin")
					comparisonCity = "Berlin";
				}

				if (getParameterByName("debug") != "true") {
					ga('send', 'event', 'City', "Barcelona (Default)", 'Open default', 1);
				}

			},
			error: function( data, textStatus, errorThrown ) {
				console.log('textStatus: ' + textStatus + ', errorThrown: ' + errorThrown + ', ERROR: ', data );
			}
		});
	}

	// takes in numeric value from 0-6
	// 0 = <$1,000 | 1 <$5,000 | 2 <$10,000 | 3 < $20,000 | 4 < $40,000 | 5 < $80,000 | 6 >= $80,000
	function gdpDescription(gdpLevel) {
		if (isNaN(gdpLevel)) {
			return "N/A";
		}
		
		if (gdpLevel == null) return "N/A";
	
		gdpLevel = parseInt(gdpLevel);
		if (gdpLevel == -1) {
			return "N/A";
		} else if (gdpLevel == 0) {
			return "Extremely Low";
		} else if (gdpLevel == 1) {
			return "Very Low";
		} else if (gdpLevel == 2) {
			return "Low";
		} else if (gdpLevel == 3) {
			return "Medium";
		} else if (gdpLevel == 4) {
			return "High";
		} else if (gdpLevel == 5) {
			return "Very High";
		} else if (gdpLevel == 6) {
			return "Extremely High";
		}
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
		countryFactsHTML(cityInfo.gdpCapita, cityInfo.population)  + 
		tempFactsHTML(cityInfo.aht, cityInfo.ahtMax, cityInfo.ahtMin, cityInfo.arTotal) + 
		'<div>' +
		'<button style="float:left;" class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent btnSelectCity" id="btnSelectCity__' + cityInfo.key + '">' +
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
			visible: true,
			cityKey: cityInfo.key, // custom field
			cityNumber: cityInfo.number
			//label: cityInfo.name
		});
		
		cityInfo.marker = marker;
		cityInfo.infowindow = infowindow;
		
		google.maps.event.addListener(marker, 'click', function() {
			openInfoWindowAndBind(infowindow, marker);
			
			compareCity(marker.cityKey, marker.cityNumber);
			
			if (getParameterByName("debug") != "true") {
				ga('send', 'event', 'City', selectedCity, marker.cityKey + ' match popup');
			}
		});

		markers.push(marker);
		markersByCityKey[cityInfo.key] = marker;
	}
	
	function getMarkerForCityKey(cityKey) {
		return markersByCityKey[cityKey];
	}
	
	function compareCityByKey(cityKey) {
		//var cityInfo = cityIndexByKeys[cityKey];
		var index = getCityNumberFromKey(cityKey);
		index = parseInt(index);
		compareCity(cityKey, index);
	}
	
	function compareCityByNumber(cityNumber) {
		var cityInfo = citiesByIndex[cityNumber];
		compareCity(cityInfo.key, cityNumber);
	}
	
	function compareCity(cityKey, cityNumber) {
		console.log('Finding city with key ' + cityKey);
	
		$("#comparisonCityName").html(citiesByRef[cityKey].name);
		
		var weatherMatch = weatherData[parseInt(cityNumber)];
		var cultureMatch = cultureData[parseInt(cityNumber)];
		var economicMatch = economicData[parseInt(cityNumber)];
		
		//citiesByIndex[parseInt(cityNumber)].matchScore;
		
		drawMatchChart(citiesByRef[cityKey].name, parseFloat(cultureMatch), parseFloat(economicMatch), parseFloat(weatherMatch), citiesByIndex[parseInt(cityNumber)].score);
		
		comparisonCity = cityKey; // set key on comparison city so we can use it later
		
		$(".mdl-navigation .btnSelectCity").attr("id","btnSelectCity__" + cityKey);
		//btnSelectCity" id="btnSelectCity__" + cityInfo.key + '"
		
		console.log(weatherMatch + " " + cultureMatch + " " + economicMatch);	
	}
	
	// helper function to return an index based on a city key
	// required because when updating sliders, we want to refresh charts
	// and at that point we only have the comparisonKey
	function getCityNumberFromKey(cityKey) {
		return parseInt(cityIndexByKeys[cityKey]);
	}
	
	function renderScore(similarityScore) {
		var html = "";
		
		html = html + "<span class='similarityScore'><span class='val'>" + Math.round(similarityScore) + "</span></span>";
		
		return html;
	}
	
	function countryFactsHTML(gdpCapita, population) {
		if (!isNumeric(gdpCapita)) gdpCapita = -1;
		if (!isNumeric(population)) population = -1;
		
		gdpCapita = Math.round(gdpCapita);
		population = Math.round(population);
		
		var gdpLabel = gdpDescription(gdpCapita);
		
		var html = "<div class='weatherFacts'>";
		html = html + "<div><span class='tempFactLabel'>";
		html = html + "Population:";
		html = html + "</span>";
		html = html + "<span class='tempFactValue' style='background-color:" + getPopColour(population) + "'>";
		html = html + getPopLabel(population);
		html = html + "</span></div>";
		
		html = html + "<div><span class='tempFactLabel'>";
		html = html + "GDP per capita:";
		html = html + "</span>";
		html = html + "<span class='tempFactValue' style='background-color:" + getGDPCapitaColour(gdpCapita) + "'>";
		html = html + gdpLabel;
		html = html + "</span></div>";
		
		html = html + "</div>";
		
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
	
	function isInt(n) {
		return n % 1 === 0;
	}
	
	function getPopLabel(population) {
		if (population >= 1000000) {
			population = population / 1000000;
			population = Math.round( population * 10) / 10; // round to one decimal place
			if (isInt(population)) {
				population = Math.round(population); // round to zero decimal places if whole number
			}
			return population + " million";
		} else if (population >= 950000) {
			return "1 million";	
		} else if (population >= 100000) {
			population = 100000 * Math.round(population/100000); // round to nearest 100k
			population = Math.round(population / 1000); // round to one decimal place
			return population + ",000";
		} else if (population >= 10000) {
			population = 10000 * Math.round(population/10000); // round to nearest 10k
			population = Math.round(population / 1000); // round to one decimal place
			return population + ",000";
		} else if (population >= 1000) {
			population = 1000 * Math.round(population/1000); // round to nearest 1k
			population = Math.round(population / 1000); // round to one decimal place
			return population + ",000";
		} else {
			return "< 1,000";
		}
	}
	
	/**
	 * Gets an HTML colour for a specified temperature (in celsius)
	 */
	function getPopColour(population) {
		if (population > 10000000) return "#FF0000";
		else if (population > 5000000) return "#FF3300";
		else if (population > 1000000) return "#FF6600"; // orange yellow
		else if (population > 100000) return "#FF9900"; // green
		else if (population > 10000) return "#FFCC00";
		else return "#FFFF00";
	}
	
	/**
	 * Gets an HTML colour for a specified temperature (in celsius)
	 */
	function getGDPCapitaColour(gdpLevel) {
		if (isNaN(gdpLevel)) {
			return;
		}
	
		gdpLevel = parseInt(gdpLevel);
		if (gdpLevel == 0) {
			return "#FFFF00";
		} else if (gdpLevel == 1) {
			return "#FFCC00";
		} else if (gdpLevel == 2) {
			return "#FF9900";
		} else if (gdpLevel == 3) {
			return "#FF6600";
		} else if (gdpLevel == 4) {
			return "#FF3300";
		} else if (gdpLevel == 5) {
			return "#FF0000";
		} else if (gdpLevel == 6) {
			return "#CC0000";
		}		
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
		if (lastInfoWindow != null && lastInfoWindow !== undefined) {
			lastInfoWindow.close();
		}
		lastInfoWindow = infowindow;
		
		$(".btnSelectCity").click(function() {
			var ref = this.id.split('__')[1];
			
			if (getParameterByName("debug") != "true") {
				ga('send', 'event', 'City', ref, 'Select from popup of ' + selectedCity, (cityCount+1));
			}
			
			selectCity(ref, false, true);

		});
		
		$(".btnWikipedia").click(function() {
			var ref = this.id.split('__')[1];
			if (getParameterByName("debug") != "true") {
				ga('send', 'event', 'City', selectedCity, 'Open Wikipedia for ' + ref);
			}			
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
	
	// Gets a direct URL for comparing two specific cities
	function getDirectLink(inURL) {
		if (selectedCity != null)
			if (inURL)
				return "http://similar.city/?city=" + selectedCity + "%26compare=" + comparisonCity; 
			else 
				return "http://similar.city/?city=" + selectedCity + "&compare=" + comparisonCity;
		else 
			return "http://similar.city/";
	}

	function createSocialURL(socialSite) {
		var url = "http://similar.city/";
		if (socialSite == "twitter") {
			if (selectedCity == null) {
				url = "http://twitter.com/home?status=Culture. Economy. Weather. What makes a %23city? Explore the %23data and compare cities at " + getDirectLink(true) + " via @JohnEllliott";
			} else {
				if (selectedCity != null && comparisonCity != null) {
					url = "http://twitter.com/home?status=Culture. Economy. Weather. What makes a %23city? Compare " + selectedCity.replace("_"," ") + " with " + comparisonCity.replace("_"," ") + " at " + getDirectLink(true) + " via @JohnEllliott";
				} else {
					url = "http://twitter.com/home?status=Culture. Economy. Weather. What makes a %23city? Compare " + selectedCity.replace("_"," ") + " at " + getDirectLink(true) + " via @JohnEllliott";				
				}
			}
		} else if (socialSite == "facebook") {
			url = "https://www.facebook.com/sharer/sharer.php?u=" + getDirectLink(true);
		} else if (socialSite == "googleplus") {
			url = "https://plus.google.com/share?url=" + getDirectLink(true);
		} else if (socialSite == "stumbleupon") {
			url = "http://www.stumbleupon.com/submit?url=" + getDirectLink(true);
		} else if (socialSite == "linkedin") {
			url = "http://www.linkedin.com/shareArticle?mini=true&url=" + getDirectLink(true) + "&title=Compare cities at similar.city&summary=Culture. Economy. Weather. What makes a city? Explore the data and compare cities.";
		} else if (socialSite == "reddit") {
			url = "http://www.reddit.com/submit?url=" + getDirectLink(true);
		} else {
			console.log("Invalid socialSite: " + socialSite);
		}
		
		$(".mdl-button--" + socialSite).attr("href", url);
	}

	var citiesByRef = {}; // uses key e.g. Kuala_Lumpur
	var citiesByIndex = {}; // uses numeric index for city key e.g. 231
	var cityIndexByKeys = {}; // maps numeric indexes to string keys
	var selectedCity; // string key for selected city
	var comparisonCity; // string key for comparison city
	var cityCount = 0;
	var heatmapMode = false;
	
	var africaMatches = {};
	var asiaMatches = {};
	var europeMatches = {};
	var naMatches = {};
	var saMatches = {};
	
	
	// pass in array of google.maps.LatLng(37.782551, -122.445368)
	function initHeatmap(data) {
		heatmap = new google.maps.visualization.HeatmapLayer({
			data: getPoints(),
			map: map
		});
	}

	function recalculateCityData(displayInfoWindow, displayMatchWindow) {
		if (!receivedWeatherData || !receivedCultureData || !receivedEconomicData) {
			return; // don't yet have all three, exit
		}
	
		clearMarkers();
		africaMatches = {};
		asiaMatches = {};
		europeMatches = {};
		naMatches = {};
		saMatches = {};
		
		//weatherData, economicData, cultureData
		
		if (weatherData.length != economicData.length || weatherData.length != cultureData.length) {
			console.log("Error: different data lengths for " + selectedCity + " weather: " + weatherData.length + ", economic: " + economicData.length + ", culture: " + cultureData.length);
			ga('send', 'exception', {
			  'exDescription': 'CityDataLengthMismatchError',
			  'exFatal': false
			});
			return; // can't do weighted mean calcs unless both have exactly same number of elements
		}
		
		var heatmapPoints = [];
		
		var closestMatchOtherRegion;
		var selectedCityObject = citiesByRef[selectedCity];
		
		for (var i = 1; i < weatherData.length; i++) { // skip first line
			compareCityInfo = citiesByIndex[i]; // grab the comparison city, pre-populated earlier with the matching index from the City_Col_Index column
			if (compareCityInfo !== undefined) { // we have found a city match result
				
				var weatherWeight, cultureWeight, econWeight;
				weatherWeight = parseFloat($("#weatherSlider").val()) / 100;
				cultureWeight = parseFloat($("#cultureSlider").val()) / 100;
				econWeight = parseFloat($("#economySlider").val()) / 100;
				
				var validCity = true;
				
				if (weatherData[i] == "" && weatherWeight > 0) { // invalid city
					validCity = false;
				}
				
				if (cultureData[i] == "" && cultureWeight > 0) { // invalid city
					validCity = false;
				}
				
				if (economicData[i] == "" && econWeight > 0) { // invalid city
					validCity = false;
				}
				
				var matchScore = (weatherWeight * weatherData[i]) + 
									(cultureWeight * cultureData[i]) + 
									(econWeight * economicData[i]);
									
				//console.log("matchScore: " + matchScore);
			
				compareCityInfo.score = Math.round( matchScore * 10) / 10;
				citiesByIndex[i] = compareCityInfo; // update arrays with match score
				citiesByRef[compareCityInfo.key] = compareCityInfo; // update arrays with match score

				if (heatmapMode) {
					if (validCity)
						createMarker(compareCityInfo.lat, compareCityInfo.lng, compareCityInfo, matchScore, true); // fixed size marker
					var weight = values[i] / 10;
					heatmapPoints[i] = {location: new google.maps.LatLng(compareCityInfo.lat, compareCityInfo.lng), weight: weight};
				} else {
					if (validCity)
						createMarker(compareCityInfo.lat, compareCityInfo.lng, compareCityInfo, matchScore, false); // fixed size marker
				}
				
				matchScore = Math.round(matchScore);
				
				if (compareCityInfo.region != selectedCityObject.region) { // if it's a different region
					if (closestMatchOtherRegion == null) closestMatchOtherRegion = compareCityInfo;
					else {
						if (closestMatchOtherRegion.score < compareCityInfo.score) {
							closestMatchOtherRegion = compareCityInfo;
						}
					}
				}
					
				if (compareCityInfo.region == "Africa" || compareCityInfo.region == "Middle East") {
					groupRegionCounter(africaMatches, compareCityInfo, matchScore)
				} else if (compareCityInfo.region == "South-East Asia" || compareCityInfo.region == "North-East Asia" || compareCityInfo.region == "South Asia" || compareCityInfo.region == "Russia & Central Asia" || compareCityInfo.region == "Pacific" || compareCityInfo.region == "Australia & New Zealand") { 
					groupRegionCounter(asiaMatches, compareCityInfo, matchScore)
				} else if (compareCityInfo.region == "Europe") {
					groupRegionCounter(europeMatches, compareCityInfo, matchScore)
				} else if (compareCityInfo.region == "North America") {
					groupRegionCounter(naMatches, compareCityInfo, matchScore)
				} else if (compareCityInfo.region == "South America") {
					groupRegionCounter(saMatches, compareCityInfo, matchScore)
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
		
		if (firstPageLoad && getParameterByName("compare").length > 0) {
			var comparisonIndex = getCityNumberFromKey(getParameterByName("compare"));
			compareCityByNumber(comparisonIndex);
		} else {
			var comparisonIndex = getCityNumberFromKey(closestMatchOtherRegion.key);
			compareCityByNumber(comparisonIndex);
		}

		firstPageLoad = false; // set this to false, so that next time this is done it doesn't load the querystring comparison
		
		if (displayInfoWindow) {
			openInfoWindowAndBind(cityInfo.infowindow, cityInfo.marker);
		} else if (displayMatchWindow) {
			openMatchInfo(selectedCity); // all cities loaded, now can open match window
		}
	}
	
	var firstPageLoad = true;
	
	var receivedWeatherData = false;
	var receivedEconomicData = false;
	var receivedCultureData = false;
	
	// numeric arrays parsed from pipe delimeted rows
	var weatherData;
	var economicData;
	var cultureData;
	
	function selectCity(cityRef, displayInfoWindow, displayMatchWindow) {
		var cityInfo = citiesByRef[cityRef];
		var cityName = cityInfo.name.split(",")[0];
		$(".je-city-name").html(cityName);
		selectedCity = cityInfo.key;
	
		cityCount = cityCount + 1;
		
		var cityCol = parseInt(cityInfo.cityCol);
		cityCol = cityCol+1;
		
		var cityWeatherDataURL, cityEconomicDataURL, cityCultureDataURL;
		if (getParameterByName("debug") == "true") {
			cityWeatherDataURL = "weatv4/disk" + cityCol + ".csv";
			cityEconomicDataURL = "econv2/disk" + cityCol + ".csv";
			cityCultureDataURL = "cultv2/disk" + cityCol + ".csv";
		} else {
			cityWeatherDataURL = "http://similar.city/weatv4/disk" + cityCol + ".csv";
			cityEconomicDataURL = "http://similar.city/econv2/disk" + cityCol + ".csv";
			cityCultureDataURL = "http://similar.city/cultv2/disk" + cityCol + ".csv";
		}
		
		receivedWeatherData = false;
		receivedCultureData = false;
		receivedEconomicData = false;
		
		$.ajax({
			url: cityWeatherDataURL,
			dataType: 'text',
			encoding:"UTF-8",
			success: function( data) {
				receivedWeatherData = true;
				weatherData = parseRowData(data);
				recalculateCityData(displayInfoWindow, displayMatchWindow);
			},
			error: function( data, textStatus, errorThrown ) {
				console.log('textStatus: ' + textStatus + ', errorThrown: ' + errorThrown + ', ERROR: ', data );
				receivedWeatherData = false;
			}
		});		

		$.ajax({
			url: cityEconomicDataURL,
			dataType: 'text',
			encoding:"UTF-8",
			success: function( data) {
				receivedEconomicData = true;
				economicData = parseRowData(data);
				recalculateCityData(displayInfoWindow, displayMatchWindow);
			},
			error: function( data, textStatus, errorThrown ) {
				console.log('textStatus: ' + textStatus + ', errorThrown: ' + errorThrown + ', ERROR: ', data );
				receivedEconomicData = false;
			}
		});	

		$.ajax({
			url: cityCultureDataURL,
			dataType: 'text',
			encoding:"UTF-8",
			success: function( data) {
				receivedCultureData = true;
				cultureData = parseRowData(data);
				recalculateCityData(displayInfoWindow, displayMatchWindow);
			},
			error: function( data, textStatus, errorThrown ) {
				console.log('textStatus: ' + textStatus + ', errorThrown: ' + errorThrown + ', ERROR: ', data );
				receivedCultureData = false;
			}
		});			
	}
	
	// Attempts to split data by line break before splitting by pipes.
	// This is because some data can randomly get extra pipes in the second line.
	function parseRowData(data) {
		var lines = data.split("\n");
		if (lines.length > 0) { // more than one line in data
			return lines[0].split("|");
		} else {
			return data.split("|");
		}
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
	
	var lastInfoWindow;
	
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
			if (lastInfoWindow != null && lastInfoWindow !== undefined) {
				lastInfoWindow.close();
			}
			lastInfoWindow = infowindow;
		}); 
		
		
	}
	  
	function createCityMatchRow(cityInfo, prefix, rowNumber) {
		if (cityInfo.score < 35) {
			$('#' + prefix + 'Row' + rowNumber).html('<td class="mdl-data-table__cell--non-numeric">[No close match]</td><td>N/A</td><td style="display:none;" ></td>');
		} else {
			var cityName = cityInfo.name;
			if (cityName.length > 29) cityName = cityName.substring(0,27) + "...";
			$('#' + prefix + 'Row' + rowNumber).html('<td class="mdl-data-table__cell--non-numeric">' + cityName +'</td><td>' + Math.round(cityInfo.score) +'</td><td style="display:none;" id="' + prefix + 'Row' + rowNumber + 'Key">' + cityInfo.key +'</td>');
		}
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
	
	function centerMap(cityKey) {
		var marker = getMarkerForCityKey(cityKey);
		var latLng = marker.getPosition(); // returns LatLng object
		map.setCenter(latLng); // setCenter takes a LatLng object
		var zoomLevel = map.getZoom() + 1;
		
		if (zoomLevel > 7) zoomLevel = 7;
		map.setZoom(zoomLevel);
		//openMatchInfo(cityInfo.key);
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

		if (getParameterByName("nowelcome") == "true") {
			$(".welcome-screen").hide();
		}	
	
		$('.cityRow').click(function() {
			var row = $(this).attr('id');
			$("#" + row + "Key").text();
			var clickedKey = $("#" + row + "Key").text();
			var cityInfo = citiesByRef[clickedKey];
			
			if (getParameterByName("debug") != "true") {
				ga('send', 'event', 'City', cityInfo.key, 'Select from global match of ' + selectedCity, (cityCount+1));
			}

			$('#matchInfo').fadeOut();
			openCity(cityInfo);
			
		});
		
		$("#closeSocialShare").click(function() {
			$(".social-sharing-card").hide();
		});
		
		$("#openSocialShare").click(function() {
			createSocialURL("twitter");
			createSocialURL("facebook");
			createSocialURL("reddit");
			createSocialURL("stumbleupon");
			createSocialURL("linkedin");
			createSocialURL("googleplus");
			$("#directLinkURL").val(getDirectLink(false));
			
			$(".social-sharing-card").show();
		});
		
		
		$("#resetSettings").click(function() {
			$("#weatherSlider").val(33.3333);
			$("#cultureSlider").val(33.3333);
			$("#economySlider").val(33.3333);
			recalculateCityData(false, false);
		});
		
		$("#btnCenterMap").click(function() {
			centerMap(selectedCity);
		});
		
		$("#btnCenterMapComparison").click(function() {
			centerMap(comparisonCity);
		});
		
		$(".welcomeClose").click(function() {
			$(".welcome-screen").hide();
		});
		
		$('#cityMatchInfo').prop("disabled",true);
		
		$('#cityMatchInfo').click(function() {
			if (getParameterByName("debug") != "true") {
				ga('send', 'event', 'City', selectedCity, 'Global matches');
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
		
		$("#weatherSliderCheckbox").change(function() {
			if (weatherLocked == false) { // previous state not ticked, now being ticked
				uncheckLock("#cultureSlider");
				checkLock("#weatherSlider");
				uncheckLock("#economySlider");
				cultureLocked = false;
				weatherLocked = true;
				economyLocked = false;
				//$("#weatherSliderCheckbox input").attr("disabled", true);
			} 
		});
		
		$("#cultureSliderCheckbox").change(function() {
			if (cultureLocked == false) { // previous state not ticked, now being ticked
				checkLock("#cultureSlider");
				uncheckLock("#weatherSlider");
				uncheckLock("#economySlider");
				cultureLocked = true;
				weatherLocked = false;
				economyLocked = false;
			} 
		});
		
		$("#economySliderCheckbox").change(function() {
		
			if (economyLocked == false) { // previous state not ticked, now being ticked
				uncheckLock("#cultureSlider");
				uncheckLock("#weatherSlider");
				checkLock("#economySlider");
				cultureLocked = false;
				weatherLocked = false;
				economyLocked = true;
			} 
		});		
		
		$("#weatherSlider").change(function() {	
			updateSlider("weather");
		});
		
		$("#economySlider").change(function() {
			updateSlider("economy");
		});

		$("#cultureSlider").change(function() {
			updateSlider("culture");
		});
		
	});
	
	function checkLock(id) {
		$(id + "Checkbox").addClass("is-checked");
		$(id + "Checkbox" + " input").prop('checked', true);
		$(id + "Checkbox" + " input").attr("disabled", true);
		$(id).attr("disabled", true);
	}
	
	function uncheckLock(id) {
		$(id + "Checkbox").removeClass("is-checked"); // mdl wrapper
		$(id + "Checkbox" + " input").prop('checked', false); // html input checkbox
		$(id + "Checkbox" + " input").attr("disabled", false); // html input checkbox
		$(id).attr("disabled", false); 
	}
	
	var cultureLocked = false;
	var economyLocked = false;
	var weatherLocked = true;
	
	var culture = 100/3;
	var economy = 100/3;
	var weather = 100/3;
	
	function updateSlider(field) {
		if (field == "culture") {
			if (economyLocked) {
				updateSliderLocked(field, "economy", "weather");
				weather = $("#weatherSlider").val();
				culture = $("#cultureSlider").val();
			} else if (weatherLocked) {
				updateSliderLocked(field, "weather", "economy");
				economy = $("#economySlider").val();
				culture = $("#cultureSlider").val();
			}
			culture = limitSlider("culture");	
		} else if (field == "economy") {
			if (cultureLocked) {
				updateSliderLocked(field, "culture", "weather");
				weather = $("#weatherSlider").val();
				economy = $("#economySlider").val();
			} else if (weatherLocked) {
				updateSliderLocked(field, "weather", "culture");
				culture = $("#cultureSlider").val();
				economy = $("#economySlider").val();
			}		
			economy = limitSlider("economy");		
			
		} else if (field == "weather") {
			if (cultureLocked) {
				updateSliderLocked(field, "culture", "economy");
				weather = $("#weatherSlider").val();
				economy = $("#economySlider").val();
			} else if (economyLocked) {
				updateSliderLocked(field, "economy", "culture");
				weather = $("#weatherSlider").val();
				culture = $("#cultureSlider").val();
			}
			weather = limitSlider("weather");			
		}
		var total = parseFloat(culture) + parseFloat(economy) + parseFloat(weather);
		var sliderSettingsString = "C = " + Math.round(culture) + ", E = " + Math.round(economy) + ", W = " + Math.round(weather);
		console.log(sliderSettingsString + ", T = " + total);
		
		recalculateCityData(false, false);
		
		if (getParameterByName("debug") != "true") {
			ga('send', 'event', 'Settings', 'Weights', sliderSettingsString);
		}
	}

	function limitSlider(field) {
		var total = parseFloat(culture) + parseFloat(economy) + parseFloat(weather);
		if (total > 100) {
			var limitedValue = parseFloat($("#" + field + "Slider").val()) - (total-100);
			$("#" + field + "Slider").val(limitedValue);
			return limitedValue;
		}	
		return parseFloat($("#" + field + "Slider").val());
	}
	
	function updateSliderLocked(changedField, lockedField, otherField) {
		var remaining = 100-$("#" + lockedField + "Slider").val();
		var otherValue = remaining - $("#" + changedField + "Slider").val();
		//otherValue = otherValue * 1.5151515151515151515;
		$("#" + otherField + "Slider").val(otherValue);
	}