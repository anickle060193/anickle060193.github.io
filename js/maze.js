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

    this._r = Math.floor( Math.random() * this.rows );
    this._c = Math.floor( Math.random() * this.columns );
    this._cells.push( new Cell( this._r, this._c ) );
}
Maze.prototype.isActive = function( r, c )
{
    for( var i = 0; i < this._cells.length; i++ )
    {
        var cell = this._cells[ i ];
        if( r === cell.r && c === cell.c )
        {
            return true;
        }
    }
    return false;
};
Maze.prototype.generateStep = function()
{
    if( this._cells.length > 0 )
    {
        var index = this._cells.length - 1;
        var cell = this._cells[ index ];
        var dirs = [ N, S, E, W ];
        dirs.shuffle();
        for( var i = 0; i < dirs.length; i++ )
        {
            var dir = dirs[ i ];
            var nr = cell.r + DR[ dir ];
            var nc = cell.c + DC[ dir ];
            if( nr >= 0 && nc >= 0 && nr < this.rows && nc < this.columns && this.get( nr, nc ) === 0 )
            {
                this.set( cell.r, cell.c, this.get( cell.r, cell.c ) | dir );
                this.set( nr, nc, this.get( nr, nc ) | OPPOSITE[ dir ] );
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
    var width = size - ( this.columns + 1 ) * strokeWidth;
    var height = size - ( this.rows + 1 ) * strokeWidth;
    var cw = width / this.columns;
    var ch = height / this.rows;

    context.fillStyle = "black";
    //context.fillRect( padding, padding, width, height );

    context.strokeStyle = "black";
    var y = padding;
    for( var r = 0; r < this.rows; r++ )
    {
        var x = padding;
        for( var c = 0; c < this.columns; c++ )
        {
            context.fillStyle = this.isActive( r, c ) ? "pink" : "white";
            context.fillRect( x + strokeWidth, y + strokeWidth, cw, ch );

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
