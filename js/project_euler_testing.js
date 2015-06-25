if( true )
{
	var div = document.getElementById( "testingPanel" );
	div.parentNode.removeChild( div );
}
else 
{
	var max = 4000000;
	var sum = 0;
	
	var prev = 1;
	var curr = 1;
	
	while( curr < max )
	{
		if( curr % 2 == 0 )
		{
			sum += curr;
		}
		var temp = curr;
		curr += prev;
		prev = temp;
	}
	
	// Output
	document.write( sum.toString() );
}