google.load('visualization', '1', {packages: ['corechart', 'bar']});
google.setOnLoadCallback(drawMatchChartDefault);

function drawMatchChartDefault() {
	drawMatchChart('Valencia', 24, 37, 27, 31);
}

function drawMatchChart(cityName, culture, economy, weather, total) {

	total = Math.round(total);

	var data = google.visualization.arrayToDataTable([
				["Factor", "Score", { role: 'style' },{'type': 'string', 'role': 'tooltip', 'p': {'html': true}}],
				["C", culture, '#00acc1', '<p class="chartTooltip">Culture<br/><b class="chartTooltip-matchNumber">' + culture + '</b></p>'],
				["E", economy, '#00acc1', '<p class="chartTooltip">Economy<br/><b class="chartTooltip-matchNumber">' + economy + '</b></p>'],
				["W", weather, '#00acc1', '<p class="chartTooltip">Weather<br/><b class="chartTooltip-matchNumber">' + weather + '</b></p>'],
				["T", total, '#8bc34a', '<p class="chartTooltip">Total<br/><b class="chartTooltip-matchNumber">' + total + '</b></p>']
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