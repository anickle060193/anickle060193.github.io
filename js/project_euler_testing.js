if( false )
{
    var div = document.getElementById( "testingPanel" );
    div.parentNode.removeChild( div );
}

function isPalindrome( num )
{
    var str = num.toString();
    var len = str.length;
    for( var i = 0; i < len / 2; i++ )
    {
        if( str[ i ] !== str[ len - i - 1 ] )
        {
            return false;
        }
    }
    return true;
}

function reverse( num )
{
    var str = num.toString();
    var len = str.length;
    for( var i = 0; i < len / 2; i++ )
    {
        var temp = str[ i ];
        str[ i ] = str[ len - i - 1 ];
        str[ len - i - 1 ] = temp;
        console.log( str );
    }
    return Number( str );
}

var maxIterations = 50;
function isLychrel( num )
{
    for( var i = 1; i <= maxIterations; i++ )
    {

        num += reverse( num );
        if( isPalindrome( num ) )
        {
            return true;
        }
    }
    return false;
}
