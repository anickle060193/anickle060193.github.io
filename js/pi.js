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

    context.setTransform( 1, 0, 0, 1, Math.round( canvas.width / 2 ) + 0.5, Math.round( canvas.height / 2 ) + 0.5 );

    render();
}

onDebouncedWindowResize( onWindowResize );


/* Line */

function Line( start, end, color )
{
    this.start = start;
    this.end = end;
    this.color = color;
    this.lineWidth = 0.1;
    this.draw = function()
    {
        var s = toCanvas( this.start );
        var e = toCanvas( this.end );
        context.beginPath();
        context.moveTo( s.x, s.y );
        context.lineTo( e.x, e.y );
        context.strokeStyle = this.color;
        context.lineWidth = this.lineWidth;
        context.stroke();
    };
}

/* Digit Position */

var maxDigitLength = 3;
var minDigitLength = 1;

var circleRadiusPercentage = 0.95 / 2;

function generateNames( iterationsRemaining, prefix, positionNames )
{
    if( prefix === undefined && positionNames === undefined )
    {
        positionNames = [ ];
        generateNames( iterationsRemaining, "", positionNames );
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
            generateNames( iterationsRemaining - 1, prefix + i.toString(), positionNames );
        }
    }
}

function generateNameData( digitLength )
{
    digitLength = Math.max( minDigitLength, Math.min( digitLength, maxDigitLength ) );

    var positionNames = generateNames( digitLength );
    var positionCount = positionNames.length;
    var segmentAngle = 2 * Math.PI / positionCount;
    var positions = { };

    for( var i = 0; i < positionCount; i++ )
    {
        var angle = segmentAngle * i;
        var x = Math.sin( angle ) * circleRadiusPercentage;
        var y = Math.cos( angle ) * circleRadiusPercentage;
        positions[ positionNames[ i ] ] = {
            p: new Point( x, y ),
            color: randomDistributedColor()
        };
    }
    return positions;
}

function generateLines( digitLength, piLength )
{
    var positions = generateNameData( digitLength );
    var lines = [ ];

    var iter = PI.iter( digitLength, piLength );
    var prev = iter.next();
    while( iter.hasNext() )
    {
        var next = iter.next();
        var start = positions[ prev ];
        var end = positions[ next ];
        var line = new Line( start.p, end.p, start.color );
        lines.push( line );
        prev = next;
    }
    return { positions: positions, lines: lines };
}


/* Data */

var data = generateLines( 2, 10000 );

/* Rendering */

function toCanvas( p )
{
    var min = Math.min( canvas.width, canvas.height );
    return new Point( p.x * min, p.y * min );
}

function render()
{
    clear( context );
    /*
    for( var key in data.positions )
    {
        var position = toCanvas( data.positions[ key ] );
        context.fillText( key, position.x, position.y );
    }
    */
    data.lines.forEach( function( line )
    {
        line.draw();
    } );
}


/* Main */

( function main()
{
    trackTransforms( context );
    onWindowResize();
} )();
