if( true )
{
	var div = document.getElementById( "testingPanel" );
	div.parentNode.removeChild( div );
}
else
{
	var number = 600851475143;

	var num = number;
	for( var i = 2; i < Math.sqrt( number ); i++ )
	{
		if( num == i )
		{
			break;
		}
		if( num % i == 0 )
		{
			num /= i;
			i--;
		}
	}
	document.write( num.toString() );
}
