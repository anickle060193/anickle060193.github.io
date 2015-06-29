/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var kInput = document.getElementById( "k" );
var kGroup = document.getElementById( "kGroup" );

var lInput = document.getElementById( "l" );
var lGroup = document.getElementById( "lGroup" );

var Rinput = document.getElementById( "R" );
var Rgroup = document.getElementById( "Rgroup" );

var colorInput = document.getElementById( "color" );
var colorGroup = document.getElementById( "colorGroup" );

var lineWidthInput = document.getElementById( "lineWidth" );
var lineWidthGroup = document.getElementById( "lineWidthGroup" );

var draw = document.getElementById( "draw" );

function onWindowResize()
{
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	
	context.setTransform( 1, 0, 0, 1, canvas.width / 2, canvas.height / 2 );
	context.translate( 0.5, 0.5 );
	
	render();
}

onDebouncedWindowResize( onWindowResize );

$( '[ data-toggle="popover" ]' ).popover();


/* Validation */

function setupValidators()
{
	validation.addValidator( kInput, kGroup, function( input )
	{
		var num = Number( input.value );
		return isFinite( num ) && 0 <= num && num <= 1;
	} );
	validation.addValidator( lInput, lGroup, function( input )
	{
		var num = Number( input.value );
		return isFinite( num ) && 0 <= num && num <= 1;
	} );
	validation.addValidator( Rinput, Rgroup, function( input )
	{
		var num = Number( input.value );
		return isFinite( num ) && 0 < num;
	} );
	validation.addValidator( colorInput, colorGroup, function( input )
	{
		return getColor() != null;
	} );
	validation.addValidator( lineWidthInput, lineWidthGroup, function( input )
	{
		var num = Number( input.value );
		return isFinite( num ) && 0 <= num;
	} );
}


/* Spirograph */

function equalWithin( p1, p2, tolerance )
{
	var xDiff = p1.x - p2.x;
	var yDiff = p1.y - p2.y;
	var dist = Math.sqrt( xDiff * xDiff + yDiff + yDiff );
	return dist < tolerance;
}

var l = 0.4;
var k = 0.8;
var R = 200;

var color = "#0011FF";
var lineWidth = 1;

var increment = 0.1;
var tolerance = 0.1;

var spirograph = null;

function getPoint( t )
{
	var x = R * ( ( 1 - k ) * Math.cos( t ) + l * k * Math.cos( ( 1 - k ) / k * t ) );
	var y = R * ( ( 1 - k ) * Math.sin( t ) - l * k * Math.sin( ( 1 - k ) / k * t ) );
	return new Point( x, y );
}

function createSpirograph()
{
	var path = new Path();
	path.strokeColor = color;
	
	var t = 0;
	var start = getPoint( t );
	var p;
	path.add( start );
	do
	{
		t += increment;
		p = getPoint( t );
		path.add( p );
	}
	while( !equalWithin( start, p, tolerance ) );
	path.closed = true;
	path.smooth();
	return path;
}

/* Input */

function getColor()
{
    var color = removeAllWhiteSpace( colorInput.value.toString() );
    if( validHexColorString( color ) )
    {
        return color;
    }
    else
    {
        return null;
    }
}

draw.addEventListener( "click", function()
{
	if( validation.allValid() )
	{
		l = Number( lInput.value );
		k = Number( kInput.value );
		R = Number( Rinput.value );
		lineWidth = Number( lineWidthInput.value );
		$( ".modal" ).modal( "hide" );
		spirograph = createSpirograph();
	}
} );


/* Render */

function render()
{
	clear( context );
	
	var t = 0;
	var start = getPoint( t );
	var p;
	context.strokeStyle = color;
	context.lineWidth = lineWidth;
	context.beginPath();
	context.moveTo( start.x, start.y );
	do
	{
		t += increment;
		p = getPoint( t );
		context.lineTo( p.x, p.y );
	}
	while( !equalWithin( start, p, tolerance ) );
	context.stroke();
}


/* Main */
( function()
{
	onWindowResize();
	render();
	
	kInput.value = k;
	lInput.value = l;
	Rinput.value = R;
	colorInput.value = color;
	lineWidthInput.value = lineWidth;
	spirograph = createSpirograph();
	
	setupValidators();
} )();