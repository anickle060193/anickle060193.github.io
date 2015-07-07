/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var widthInput = document.getElementById( "width" );
var heightInput = document.getElementById( "height" );
var rowsInput = document.getElementById( "rows" );
var columnsInput = document.getElementById( "columns" );

var generateButton = document.getElementById( "generate" );

var graphSizePercent = 0.25;

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
    validation.addValidator( widthInput, isNonnegative );
    validation.addValidator( heightInput, isNonnegative );
    validation.addValidator( rowsInput, isNonnegative );
    validation.addValidator( columnsInput, isNonnegative );
}


/* Maze Generation */
// From http://weblog.jamisbuck.org/2011/1/27/maze-generation-growing-tree-algorithm

var padding = 20;
var strokeWidth = 1;

function Cell( r, c )
{
    this.r = r;
    this.c = c;
}

var maze = new Maze( 20, 20, 800, 800 );

var N = 0x1;
var S = 0x2;
var E = 0x4;
var W = 0x8;

var DR = { };
DR[ N ] = -1;
DR[ E ] = 0;
DR[ S ] = 1;
DR[ W ] = 0;

var DC = { };
DC[ N ] = 0;
DC[ E ] = 1;
DC[ S ] = 0;
DC[ W ] = -1;

var OPPOSITE = { };
OPPOSITE[ N ] = S;
OPPOSITE[ E ] = E;
OPPOSITE[ S ] = N;
OPPOSITE[ W ] = E;

function Maze( rows, columns )
{
    this.rows = rows;
    this.columns = columns;

    this._maze = [ ];
    this._cells = [ ];

    var r = Math.floor( Math.random() * this.rows );
    var c = Math.floor( Math.random() * this.columns );
    this._cells.push( new Cell( r, c ) );
}
Maze.prototype.getFill = function( r, c )
{
    for( var i = 0; i < this._cells.length; i++ )
    {
        var cell = this._cells[ i ];
        if( r === cell.r && c === cell.c )
        {
            return "pink";
        }
    }
    return "white";
};
Maze.prototype.selectIndex = function( method )
{
    method = method.toLowerCase();
    if( method === "random" )
    {
        return Math.floor( Math.random() * this._cells.length );
    }
    else if( method === "first" )
    {
        return 0;
    }
    else if( method === "newest" )
    {
        return this._cells.length - 1;
    }
    else if( method === "middle" )
    {
        return Math.floor( this._cells.length / 2 );
    }
    else
    {
        throw new Error( "'" + method + "' is not a valid index selection method." );
    }
};
Maze.prototype.generateStep = function()
{
    if( this._cells.length > 0 )
    {
        var index = this.selectIndex( "random" );
        var r = this._cells[ index ].r;
        var c = this._cells[ index ].c;
        var dirs = [ N, S, E, W ];
        dirs.shuffle();
        for( var i = 0; i < dirs.length; i++ )
        {
            var dir = dirs[ i ];
            var nr = r + DR[ dir ];
            var nc = c + DC[ dir ];
            if( nr >= 0 && nc >= 0 && nr < this.rows && nc < this.columns && this.get( nr, nc ) === 0 )
            {
                var old = this.get( r, c );
                this.set( r, c, old | dir );

                var nOld = this.get( nr, nc );
                this.set( nr, nc, nOld | OPPOSITE[ dir ] );

                this._cells.push( new Cell( nr, nc ) );
                index = -1;
                break;
            }
        }
        if( index !== -1 )
        {
            this._cells.splice( index, 1 );
        }
    }
    return this._cells.length === 0;
};
Maze.prototype.set = function( row, col, value )
{
    if( this._maze[ row ] === undefined )
    {
        this._maze[ row ] = [ ];
    }
    this._maze[ row ][ col ] = value;
};
Maze.prototype.get = function( row, col )
{
    if( this._maze[ row ] === undefined )
    {
        return 0;
    }
    else if( this._maze[ row ][ col ] === undefined )
    {
        return 0;
    }
    else
    {
        return this._maze[ row ][ col ];
    }
};
Maze.prototype.draw = function()
{
    var size = Math.min( canvas.width, canvas.height ) - 2 * padding;
    var xOffset = ( canvas.width - size ) / 2;
    var yOffset = ( canvas.height - size ) / 2;
    var width = size - ( this.columns + 1 ) * strokeWidth;
    var height = size - ( this.rows + 1 ) * strokeWidth;
    var cw = width / this.columns;
    var ch = height / this.rows;

    context.strokeStyle = "black";
    var y = yOffset;
    for( var r = 0; r < this.rows; r++ )
    {
        var x = xOffset;
        for( var c = 0; c < this.columns; c++ )
        {
            context.fillStyle = this.getFill( r, c );
            context.fillRect( x, y, cw + strokeWidth * 2, ch + strokeWidth * 2 );

            var cell = this.get( r, c );
            if( ( cell & N ) !== N || r === 0 )
            {
                drawLine( x, y, x + cw, y, strokeWidth );
            }
            if( ( cell & W ) !== W || c === 0 )
            {
                drawLine( x, y, x, y + ch, strokeWidth );
            }
            x += cw + strokeWidth;
        }
        y += ch + strokeWidth;
    }
    drawLine( xOffset, y, xOffset + size, y );
    drawLine( x, yOffset, x, yOffset + size );
};

function generate()
{
    var rows = Number( rowsInput.value );
    var columns = Number( columnsInput.value );
    var width = Number( widthInput.value );
    var height = Number( heightInput.value );
    maze = new Maze( rows, columns, width, height );
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
        maze.draw( 10, 10 );
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
    onWindowResize();
    render();
    startAnimation( update, render );
} )();