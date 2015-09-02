google.load('visualization', '1', {packages: ['corechart', 'bar']});
google.setOnLoadCallback(drawTopX);

function drawTopX() {

	var data = google.visualization.arrayToDataTable([
				["Factor", "Score",{type:'string',role:'tooltip'}],
				["C", 8.94, 'test tooltip'],
				["E", 10.49, 'test tooltip'],
				["W", 25.30, 'test tooltip']
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
		//left : 200,
		//top : 300,
		//width : 100, // width of chart wrapper
		//height : 200, // height of chart wrapper 
        
		chartArea : {left:20,top:10,width:'50%',height:'75%'},        
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