/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

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
// From http://weblog.jamisbuck.org/2011/1/10/maze-generation-prim-s-algorithm

var padding = 20;
var strokeWidth = 1;

function Cell( r, c )
{
    this.r = r;
    this.c = c;
}

var N = 0x1;
var S = 0x2;
var E = 0x4;
var W = 0x8;

var IN = 0x10;
var FRONTIER = 0x2;
var OPPOSITE = { };
OPPOSITE[ N ] = S;
OPPOSITE[ S ] = N;
OPPOSITE[ E ] = W;
OPPOSITE[ W ] = E;

function direction( r1, c1, r2, c2 )
{
    if( c1 < c2 )
    {
        return E;
    }
    if( c1 > c2 )
    {
        return W;
    }
    if( r1 < r2 )
    {
        return S;
    }
    if( r1 > r2 )
    {
        return N;
    }
}

var maze = null;

function Maze( rows, columns )
{
    this.rows = rows;
    this.columns = columns;

    this._maze = [ ];
    this._frontier = [ ];

    var r = Math.floor( Math.random() * this.rows );
    var c = Math.floor( Math.random() * this.columns );
    this.mark( r, c );
}
Maze.prototype.getFill = function( r, c )
{
    for( var i = 0; i < this._frontier.length; i++ )
    {
        var cell = this._frontier[ i ];
        if( r === cell.r && c === cell.c )
        {
            return "pink";
        }
    }
    return "white";
};
Maze.prototype.addFrontier = function( r, c )
{
    if( r >= 0 && r < this.rows && c >= 0 && c < this.columns && this.get( r, c ) === 0 )
    {
        this.set( r, c, this.get( r, c ) | FRONTIER );
        this._frontier.push( new Cell( r, c ) );
    }
};
Maze.prototype.mark = function( r, c )
{
    this.set( r, c, this.get( r, c ) | IN );
    this.addFrontier( r - 1, c );
    this.addFrontier( r, c - 1 );
    this.addFrontier( r + 1, c );
    this.addFrontier( r, c + 1 );
};
Maze.prototype.neighbors = function( r, c )
{
    var n = [ ];
    if( c > 0 && ( this.get( r, c - 1 ) & IN ) !== 0 )
    {
        n.push( new Cell( r, c - 1 ) );
    }
    if( c + 1 < this.columns && ( this.get( r, c + 1 ) & IN ) !== 0 )
    {
        n.push( new Cell( r, c + 1 ) );
    }
    if( r > 0 && ( this.get( r - 1, c ) & IN ) !== 0 )
    {
        n.push( new Cell( r - 1, c ) );
    }
    if( r + 1 < this.rows && ( this.get( r + 1, c ) & IN ) !== 0 )
    {
        n.push( new Cell( r + 1, c ) );
    }
    return n;
};
Maze.prototype.generateStep = function()
{
    if( this._frontier.length > 0 )
    {
        var cell = this._frontier.splice( Math.floor( Math.random() * this._frontier.length ), 1 )[ 0 ];
        var n = this.neighbors( cell.r, cell.c );
        var nCell = n[ Math.floor( Math.random() * n.length ) ];

        var dir = direction( cell.r, cell.c, nCell.r, nCell.c );
        this.set( cell.r, cell.c, this.get( cell.r, cell.c ) | dir );
        this.set( nCell.r, nCell.c, this.get( nCell.r, nCell.c ) | OPPOSITE[ dir ] );

        this.mark( cell.r, cell.c );
    }
    return this._frontier.length === 0;
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
        maze.draw();
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
