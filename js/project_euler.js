function _write( str )
{
    if( str.indexOf( 'rel="stylesheet"' ) != -1 )
    {
        var href = $( str ).attr( "href" );
        if( $.inArray( href, styleSheets ) === -1 )
        {
            $( "head" ).append( str );
            styleSheets.push( href );
        }
    }
    else
    {
        for( var id in gists )
        {
            if( str.indexOf( id ) != -1 )
            {
                gists[ id ].innerHTML = str;
            }
        }
    }
}

var originalWrite = document.write;
document.write = _write;

var gists = { };
var styleSheets = [ ];

function createScriptElement( id )
{
    var scriptElement = document.createElement( "script" );
    scriptElement.src = "https://gist.github.com/" + id + ".js";
    return scriptElement;
}

( function()
{
    var gistDivs = document.querySelectorAll( "[ data-gist ]" );
    for( var i = 0; i < gistDivs.length; i++ )
    {
        var gistDiv = gistDivs[ i ];
        var id = gistDiv.dataset.id;
        gists[ id ] = gistDiv;
        var scriptElement = document.createElement( "script" );
        scriptElement.src = "https://gist.github.com/" + id + ".js";
        gistDiv.appendChild( scriptElement );
    }
} )();
