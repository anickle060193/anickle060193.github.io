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

var increment = 0.1;
var tolerance = 1;

var spirograph = null;

function equalWithin( p1, p2, tolerance )
{
	var xDiff = p1.x - p2.x;
	var yDiff = p1.y - p2.y;
	var dist = Math.sqrt( xDiff * xDiff + yDiff + yDiff );
	return dist < tolerance;
}

function Spirograph( l, k, R, color, lineWidth )
{
	this.color = color;
	this.lineWidth = lineWidth;
	
	this.path = [ ];
	this.l = l;
	this.k = k;
	this.R = R;
	
	this._a = 1 - this.k;
	this._b = this._a / this.k;
	this._c = l * k;
	
	this.createPath();
}

Spirograph.prototype.getPoint = function( t )
{
	var x = this.R * ( this._a * Math.cos( t ) + this._c * Math.cos( this._b * t ) );
	var y = this.R * ( this._a * Math.sin( t ) - this._c * Math.sin( this._b * t ) );
	return new Point( x, y );
};

Spirograph.prototype.createPath = function()
{
	this.path = [ ];
	
	this._a = 1 - this.k;
	this._b = this._a / this.k;
	this._c = this.l * this.k;
	
	var t = 0;
	var start = this.getPoint( t );
	var p;
	this.path.push( start );
	do
	{
		t += increment;
		p = this.getPoint( t );
		this.path.push( p );
	}
	while( !equalWithin( start, p, tolerance ) );
};

Spirograph.prototype.draw = function()
{
	context.strokeStyle = this.color;
	context.lineWidth = this.lineWidth;
	context.beginPath();
	for( var i = 0; i < this.path.length; i++ )
	{
		var p = this.path[ i ];
		context.lineTo( p.x, p.y );
	}
	context.stroke();
};


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

function createSpirograph()
{
	var l = Number( lInput.value );
	var k = Number( kInput.value );
	var R = Number( Rinput.value );
	var lineWidth = Number( lineWidthInput.value );
	var color = getColor();
	
	spirograph = new Spirograph( l, k, R, color, lineWidth );
}

draw.addEventListener( "click", function()
{
	if( validation.allValid() )
	{
		$( ".modal" ).modal( "hide" );
		
		createSpirograph();
	}
} );


/* Render */

function render()
{
	clear( context );
	
	if( spirograph != null )
	{
		spirograph.draw();
	}
}


/* Main */
( function()
{
	onWindowResize();
	createSpirograph();
	setupValidators();
	render();
} )();