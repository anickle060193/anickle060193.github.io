"use strict";

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

    context.setTransform( 1, 0, 0, 1, 0.2, 0.2 );

    rescale();
    render();
}

onDebouncedWindowResize( onWindowResize );


/* Triangles */

var triangles = [ ];

var columns;
var rows;

var triangleWidth = 30;
var triangleHeight = Math.sqrt( 3 ) / 2 * triangleWidth;

var hMin = 0.5;
var hMax = 0.6;
var hRange = hMax - hMin;

function hue()
{
    return random( hRange );
}

function augmentHue( h )
{
    var v = hRange * 0.03;
    var r = random( v * 2 ) - v;
    h += r;
    if( h < 0 )
    {
        h = -h;
    }
    else if( h > hRange )
    {
        h = hRange - ( h - hRange );
    }
    return h;
}

function color( h )
{
    return HSVtoRGB( h + hMin, 0.85, 0.75 );
}

function rescale()
{
    var width = canvas.width;
    var height = canvas.height;
    
    columns = Math.ceil( width / triangleWidth );
    rows = Math.ceil( height / triangleHeight );
    
    var len = triangles.length;
    if( rows > len )
    {
        for( var i = len; i <= rows; i++ )
        {
            triangles[ i ] = [ ];
        }
    }
    for( var row = 0; row <= rows; row++ )
    {
        for( var col = 0; col <= columns; col++ )
        {
            if( triangles[ row ][ col ] === undefined )
            {
                triangles[ row ][ col ] = [ hue(), hue() ];
            }
        }
    }
}


/* Rendering */

function render()
{
    var y = -triangleHeight / 2;
    for( var row = 0; row <= rows; row++ )
    {
        var x = ( row % 2 == 0 ) ? -triangleWidth / 2 : -triangleWidth;
        for( var col = 0; col <= columns; col++ )
        {
            var a = new Point( x,                     y );
            var b = new Point( a.x + triangleWidth,   y );
            
            var c = new Point( x + triangleWidth / 2, y + triangleHeight );
            var d = new Point( c.x + triangleWidth,   y + triangleHeight );
            
            context.fillStyle = color( triangles[ row ][ col ][ 0 ] );
            context.beginPath();
            context.moveTo( a.x, a.y );
            context.lineTo( b.x, b.y );
            context.lineTo( c.x, c.y );
            context.fill();
            
            context.fillStyle = color( triangles[ row ][ col ][ 1 ] );
            context.beginPath();
            context.moveTo( b.x, b.y );
            context.lineTo( c.x, c.y );
            context.lineTo( d.x, d.y );
            context.fill();
            
            x += triangleWidth;
        }
        y += triangleHeight;
    }
}


/* Animation */

function update()
{
    for( var row = 0; row <= rows; row++ )
    {
        for( var col = 0; col <= columns; col++ )
        {
            var h = triangles[ row ][ col ];
            h[ 0 ] = augmentHue( h[ 0 ] );
            h[ 1 ] = augmentHue( h[ 1 ] );        
        }
    }
}


/* Main */

( function()
{
    onWindowResize();

    startAnimation( update, render );
} )();
