$( document ).ready(function() {
    console.log( "ready!" );
	//$('#drawerButton').click(function() {
	//	console.log( "xxx!" );
	//	$('.mdl-layout__drawer').show();
	//});
	
	$('.mdl-layout__drawer-button').on('click', function () {
		console.log('scrolled');  
		$('.mdl-layout__drawer').show();
	});
});