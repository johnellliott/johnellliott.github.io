
function drawMatchChartDefault() {
	drawMatchChart('Valencia', 24, 37, 27, 31);
}

// #E6F7F9 lighest blue for culture/economy when in climate mode

function drawMatchChart(cityName, culture, economy, weather, total) {

	var cultureEcomomyBarColor = '#00acc1';
	var totalColor = '#8bc34a';
	if (climateMode) {
		cultureEcomomyBarColor = "#E6F7F9";
		totalColor = "#E6F7F9";
	} else {
		cultureEcomomyBarColor = "#00acc1";
		totalColor = '#8bc34a';
	}

	total = Math.round(total);

	var data = google.visualization.arrayToDataTable([
				["Factor", "Score", { role: 'style' },{'type': 'string', 'role': 'tooltip', 'p': {'html': true}}],
				["C", culture, cultureEcomomyBarColor, '<p class="chartTooltip">Culture<br/><b class="chartTooltip-matchNumber">' + culture + '</b></p>'],
				["E", economy, cultureEcomomyBarColor, '<p class="chartTooltip">Economy<br/><b class="chartTooltip-matchNumber">' + economy + '</b></p>'],
				["W", weather, '#00acc1', '<p class="chartTooltip">Weather<br/><b class="chartTooltip-matchNumber">' + weather + '</b></p>'],
				["T", total, totalColor, '<p class="chartTooltip">Total<br/><b class="chartTooltip-matchNumber">' + total + '</b></p>']
			]);

	var options = {
		chart : {
			//title: 'Motivation and Energy Level Throughout the Day',
			//subtitle: 'Based on a scale of 1 to 10'
		},
        backgroundColor : 'transparent',
		legend : {
            position : 'none'
        },
		tooltip: {isHtml: true},
		//left : 200,
		//top : 300,
		//width : 100, // width of chart wrapper
		//height : 200, // height of chart wrapper 
        
		chartArea : {left:20,top:10,width:'75%',height:'75%'},        
		vAxis : {
			gridlines : {
				count : 3
			},
            viewWindow : {
                max: 100,
                min: 0
            }
		},
		hAxis : {
			//title: 'Time of Day',
			//format: 'h:mm a',
			textPosition : 'out'
		}
	};

	var material = new google.visualization.ColumnChart(document.getElementById('comparison_chart'));
    material.draw(data, google.charts.Bar.convertOptions(options));
	//material.draw(data, options);
}


/*
 * Charts used in blog are below
 */


 
/*
 * htmlRef - the string id of the HTML element in which this will be drawn
 * data - the data used in populating the chart
 */ 
function createBarChart(htmlRef, data) {

	var options = {
		chartArea : {left:115,top:10,width:'95%',height:'85%'},  
		bars: 'horizontal', // Required for Material Bar Charts.
		colors:['rgb(3, 169, 244)','#8bc34a','#00acc1'],
		legend: { position: 'bottom'},
        bar: { groupWidth: '75%' },
        isStacked: true,
		hAxis : {
			gridlines : {
				count : 5
			},
            maxValue: 350
		},	
		
		annotations: {
			textStyle: {
				fontName: 'Roboto',
				fontSize: 15,
				bold: false,
				italic: false,
				// The color of the text.
				color: '#707070 ',
				// The color of the text outline.
				//auraColor: '#d799ae',
				// The transparency of the text.
				opacity: 0.8
			},
			alwaysOutside: true
		}		
	};

	var chart = new google.visualization.BarChart(document.getElementById(htmlRef));
	chart.draw(data, options);
}


function createBubbleChart(htmlRef, data) {

	var options = {
		chartArea : {left:115,top:10,width:'95%',height:'85%'},  
		bubble: {textStyle: {fontSize: 11}},
		legend: { position: 'bottom'},
		hAxis : {
			title: 'Weather Distance',
			viewWindow : {
				max: 100
			}	
		},	
		vAxis : {
			title: 'Economic & Cultural Distance',
			viewWindow : {
				max: 100
			}	
		},	
		
	};

	var chart = new google.visualization.BubbleChart(document.getElementById(htmlRef));
	chart.draw(data, options);
}