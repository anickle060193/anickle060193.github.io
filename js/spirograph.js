/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

function onWindowResize()
{
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	
	context.setTransform( 1, 0, 0, 1, Math.floor( canvas.width / 2 ) + 0.5, Math.floor( canvas.height / 2 ) + 0.5 );
	
	render();
}

onDebouncedWindowResize( onWindowResize );


/* Spirograph */

function equalWithin( p1, p2, tolerance )
{
	var xDiff = p1.x - p2.x;
	var yDiff = p1.y - p2.y;
	var dist = Math.sqrt( xDiff * xDiff + yDiff + yDiff );
	return dist < tolerance;
}

var l = 0.3;
var k = -0.9;
var R = 1000;
var increment = 0.1;
var tolerance = 0.1;

function getPoint( t )
{
	var x = R * ( ( 1 - k ) * Math.cos( t ) + l * k * Math.cos( ( 1 - k ) / k * t ) );
	var y = R * ( ( 1 - k ) * Math.sin( t ) - l * k * Math.sin( ( 1 - k ) / k * t ) );
	return new Point( x, y );
}

/* Render */

function render()
{
	context.beginPath();
	var t = 0;
	var start = getPoint( t );
	var p;
	context.lineWidth = 0.5;
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
} )();