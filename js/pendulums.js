/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var graphCanvas = document.createElement( "canvas" );
var graph = graphCanvas.getContext( "2d" );

var lengthInput = document.getElementById( "length" );
var updateButton = document.getElementById( "update" );

var graphSizePercent = 0.25;

function onWindowResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    context.setTransform( 1, 0, 0, 1, canvas.width / 2, canvas.height / 2 );
    context.rotate( Math.PI / 2 );

    graphCanvas.width = canvas.width;
    graphCanvas.height = canvas.height * graphSizePercent;
    graph.setTransform( 1, 0, 0, -1, graphCanvas.width / 2, graphCanvas.height / 2 );

    render();
}

onDebouncedWindowResize( onWindowResize );


/* Validation */

var validation = new ValidationGroup();

function setupValidators()
{
    validation.addValidator( lengthInput, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 < num;
    } );
}


/* Pendulum */

var g = 9.80665;
var resetAngle = Math.PI / 2;

var length = 100;
var angle = 0;
var initialAngle = 0;
var period = 0;

function setLength( len )
{
    length = len;
    setAngle( resetAngle );
}

function setAngle( a )
{
    angle = a;
    initialAngle = a;
    t = 0;
    period = 1 / ( Math.sqrt( g / length ) / ( 2 * Math.PI ) );
}

function initializeValues()
{
    setLength( Number( lengthInput.value ) );
    setAngle( resetAngle );
}


/* Input Handler */

updateButton.addEventListener( "click", function()
{
    if( validation.allValid() )
    {
        setLength( Number( lengthInput.value ) );
        $( ".modal" ).modal( "hide" );
    }
} );

var down = false;

canvas.addEventListener( "pointerdown", function( e )
{
    e.preventDefault();
    down = true;
} );
canvas.addEventListener( "pointerup", function( e )
{
    e.preventDefault();
    down = false;
} );
canvas.addEventListener( "pointermove", function( e )
{
    if( down )
    {
        e.preventDefault();
        var p = getRelativeCoordinates( e );
        p = context.transformedPoint( p.x, p.y );
        var a = Math.atan2( -p.x, p.y ) + Math.PI / 2;
        if( a > Math.PI )
        {
            a = -2 * Math.PI + a;
        }
        setAngle( a );
    }
} );


/* Render */

function render()
{
    clear( context );

    context.save();

    context.setTransform( 1, 0, 0, 1, -canvas.width / 2, canvas.height / 2 );
    var y = -canvas.height / 2;
    //context.drawImage( graphCanvas, canvas.width / 2, y );

    context.restore();

    fillCircle( context, 0, 0, 5, "black" );
    fillCircle( context, 0, 0, 3, "white" );

    context.lineWidth = 1.0;

    context.beginPath();
    context.moveTo( 0, 0 );

    var x = length * Math.cos( angle );
    var y = length * Math.sin( angle );
    context.lineTo( x, y );

    context.stroke();
    fillCircle( context, x, y, 6, "black" );
}


/* Animation */

var t = 0;

var verticalGraphScale = 1;
var horizontalGraphScale = 10;

function update( elapsedTime )
{
    if( !down )
    {
        t += elapsedTime * 2;
        if( t > period )
        {
            t %= period;
            clear( graph );
        }
        angle = initialAngle * Math.cos( Math.sqrt( g / length ) * t );

        var x = t;
        var y = Math.sqrt( 2 * g * length * ( Math.cos( angle ) - Math.cos( initialAngle ) ) );
        if( t > period / 2 )
        {
            x = period - t;
            y *= -1;
        }
        x -= period / 4;
        fillCircle( graph, x * horizontalGraphScale, y * verticalGraphScale, 0.1, "black" );
    }
}


/* Main */

( function main()
{
    setupValidators();
    initializeValues();
    trackTransforms( context );
    onWindowResize();
    render();
    startAnimation( update, render );
} )();
