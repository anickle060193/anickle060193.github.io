"use strict";

/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var colorInput = document.getElementById( "color" );
var lineWidthInput = document.getElementById( "lineWidth" );

var typeSelect = document.getElementById( "type" );
var drawButton = document.getElementById( "draw" );

function onWindowResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    render();
}

onDebouncedWindowResize( onWindowResize );

/* Validation */

var display = new ValidationGroup();

function setupDisplayValidators()
{
    display.addValidator( colorInput, function( input )
    {
        return getColor() != null;
    } );
    display.addValidator( lineWidthInput, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 <= num;
    } );
}


/* Fractals */

var fractal = null;

function Fractal( color, lineWidth )
{
    this.color = color;
    this.lineWidth = lineWidth;
}
Fractal.prototype.draw = function()
{
};

function TreeFractal( color, lineWidth, depth, angle )
{
    Fractal.call( this, color, lineWidth );

    this.depth = depth;
    this.angle = angle;
}
TreeFractal.prototype = Object.create( Fractal.prototype );
TreeFractal.prototype.drawLine = function( x1, y1, x2, y2 )
{
    context.strokeStyle = this.color;
    context.lineWidth = this.lineWidth;
    context.moveTo( x1, y1 );
    context.lineTo( x2, y2 );
    context.stroke();
};
TreeFractal.prototype.draw = function( x, y, angle, depth )
{
    if( x === undefined )
    {
        x = canvas.width / 2;
        y = canvas.height * 0.95;
        angle = this.angle;
        depth = this.depth;
    }
    if( depth > 0 )
    {
        var x2 = x + Math.cos( angle ) * depth * 10.0;
        var y2 = y + Math.sin( angle ) * depth * 10.0
        this.drawLine( x, y, x2, y2 );
        this.draw( x2, y2, angle - Math.PI / 12, depth - 1 );
        this.draw( x2, y2, angle + Math.PI / 12, depth - 1 );
    }
};


/* Input */

typeSelect.addEventListener( "change", function()
{
    setTracing( typeSelect.value );
} );

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


/* Animation */

function update( elapsedTime )
{
}


/* Render */

function render()
{
    clear( context );

    if( fractal )
    {
        fractal.draw();
    }
}


/* Main */

( function()
{
    onWindowResize();
    setupDisplayValidators();
    startAnimation( update, render );

    fractal = new TreeFractal( "red", 1, 10, Math.PI / 6 );
} )();
