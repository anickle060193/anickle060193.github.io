var max = 1000;
var multiples = [ 3, 5 ];
var sum = 0;

// Sort multiples
multiples.sort( function( a, b )
{
	return a - b;
} );

// Remove any multiples of smaller multiples
for( var i = multiples.length - 1; i >= 0; i-- )
{
	for( var j = 0; j < i; j++ )
	{
		if( multiples[ i ] % multiples[ j ] == 0 )
		{
			multiples.splice( i, 1 );
		}
	}
}

// Check all numbers up to max for multiple
for( var i = 1; i < max; i++ )
{
	for( var j = 0; j < multiples.length; j++ )
	{
		if( i % multiples[ j ] == 0 )
		{
			sum += i;
			break;
		}
	}
}

// Output
document.write( sum.toString() );