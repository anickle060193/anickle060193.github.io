if( true )
{
	var div = document.getElementById( "testingPanel" );
	div.parentNode.removeChild( div );
}
else
{
var min = 100;
var max = 999;

var maxPalindrome = 0;

function isPalindrome( number )
{
	var str = number.toString();
	var len = str.length;
	for( var i = 0; i < len / 2; i++ )
	{
		if( str[ i ] != str[ len - i - 1 ] )
		{
			return false;
		}
	}
	return true;
}

for( var i = max; i >= min; i-- )
{
	for( var j = max; j >= min; j-- )
	{
		var product = i * j;
		if( product > maxPalindrome && isPalindrome( product ) )
		{
			maxPalindrome = product;
		}
	}
}
document.write( maxPalindrome );
}
