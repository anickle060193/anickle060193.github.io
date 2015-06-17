/* Includes */

/// <reference path="utilities.js" />
/// <reference path="pi_data.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

function onWindowResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height= canvas.clientHeight

    context.setTransform( 1, 0, 0, 1, canvas.width / 2, canvas.height / 2 );

    render();
}

onDebouncedWindowResize( onWindowResize );


/* Line */

function Line( start, end )
{
    this.start = start;
    this.end = end;
    this.color = generateRandomDistributedColor();
    this.draw = function()
    {
        var s = toCanvas( this.start );
        var e = toCanvas( this.end );
        context.beginPath();
        context.moveTo( s.x, e.y );
        context.lineTo( e.x, e.y );
        context.strokeStyle = this.color;
        context.stroke();
    };
}

/* Digit Position */

var maxDigitLength = 3;
var minDigitLength = 1;

var circleRadiusPercentage = 0.8 / 2;

function generatePositionNames( iterationsRemaining, prefix, positionNames )
{
    if( prefix === undefined && positionNames === undefined )
    {
        positionNames = [ ];
        generatePositionNames( iterationsRemaining, "", positionNames );
        return positionNames;
    }
    else if( iterationsRemaining == 0 )
    {
        positionNames.push( prefix );
    }
    else
    {
        for( var i = 0; i <= 9; i++ )
        {
            generatePositionNames( iterationsRemaining - 1, prefix + i.toString(), positionNames );
        }
    }
}

function generatePositions( digitLength )
{
    digitLength = Math.max( minDigitLength, Math.min( digitLength, maxDigitLength ) );

    var positionNames = generatePositionNames( digitLength );
    var positionCount = Math.pow( 9, digitLength );
    var segmentAngle = 2 * Math.PI / positionCount;
    var positions = { };

    for( var i = 0; i < positionCount; i++ )
    {
        var angle = segmentAngle * i;
        var x = Math.sin( angle ) * circleRadiusPercentage;
        var y = Math.cos( angle ) * circleRadiusPercentage;
        positions[ positionNames[ i ] ] = new Point( x, y );
    }
    return positions;
}

function generateLines( digitLength, piLength )
{
    var positions = generatePositions( 1 );
    var lines = [ ];

    var iter = PI.iter( digitLength, piLength );

}


/* Data */



/* Rendering */

function toCanvas( p )
{
    var min = Math.min( canvas.width, canvas.height );
    return new Point( p.x * min, p.y * min );
}

function render()
{
    var scale = 200;
    for( var key in positions )
    {
        var p = toCanvas( positions[ key ] );
        fillCircle( context, p.x, p.y, 10, "black" );
    }
}


/* Main */

( function main()
{
    trackTransforms( context );
    onWindowResize();
} )();
