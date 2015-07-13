"use strict";

/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />
/// <reference path="maze.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var rowsInput = document.getElementById( "rows" );
var columnsInput = document.getElementById( "columns" );

var generateButton = document.getElementById( "generate" );

function onWindowResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    context.setTransform( 1, 0, 0, 1, 0.5, 0.5 );

    render();
}

onDebouncedWindowResize( onWindowResize );


/* Utility */

function drawLine( x1, y1, x2, y2, strokeWidth )
{
    context.lineWidth = strokeWidth
    context.beginPath();
    context.moveTo( x1, y1 );
    context.lineTo( x2, y2 );
    context.stroke();
}


/* Validation */

var validation = new ValidationGroup();

function isNonnegative( input )
{
    var num = Number( input.value );
    return isFinite( num ) && 0 < num;
}

function setupValidators()
{
    validation.addValidator( rowsInput, isNonnegative );
    validation.addValidator( columnsInput, isNonnegative );
}


/* Maze Generation */

var maze = null;

function generate()
{
    var rows = Number( rowsInput.value );
    var columns = Number( columnsInput.value );
    maze = new Maze( rows, columns );
}


/* Input Handler */

generateButton.addEventListener( "click", function()
{
    if( validation.allValid() )
    {
        generate();

        $( ".modal" ).modal( "hide" );
    }
} );


/* Render */

function render()
{
    clear( context );

    if( maze != null )
    {
        maze.draw( context );
    }
}


/* Animation */

function update( elapsedTime )
{
    maze.generateStep();
}


/* Main */

( function main()
{
    setupValidators();
    generate();
    onWindowResize();
    render();
    startAnimation( update, render );
} )();
