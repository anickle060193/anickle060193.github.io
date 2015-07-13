"use strict";

/* Utilities */

function contains( array, o )
{
    var oStr = JSON.stringify( o );
    for( var i = 0; i < array.length; i++ )
    {
        if( JSON.stringify( array[ i ] ) === oStr )
        {
            return true;
        }
    }
    return false;
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
Cell.prototype.equals = function( cell )
{
    return this.r === cell.r && this.c === cell.c;
}

var N = 0x1;
var S = 0x2;
var E = 0x4;
var W = 0x8;

var IN = 0x10;
var FRONTIER = 0x20;
var OPPOSITE = { };
OPPOSITE[ N ] = S;
OPPOSITE[ S ] = N;
OPPOSITE[ E ] = W;
OPPOSITE[ W ] = E;

var DR = { };
DR[ N ] = -1;
DR[ S ] = 1;
DR[ E ] = 0;
DR[ W ] = 0;

var DC = { };
DC[ N ] = 0;
DC[ S ] = 0;
DC[ E ] = 1;
DC[ W ] = -1;

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

function MazeGeneration( maze )
{
    this.maze = maze;
    this.done = false;
}
MazeGeneration.prototype.generateStep = function()
{
    if( !this.done )
    {
        this.done = true;
    }
    return this.done;
};
MazeGeneration.prototype.generate = function()
{
    while( !this.done )
    {
        this.done = this.generateStep();
    }
};
MazeGeneration.prototype.getFill = function( r, c )
{
    return "white";
};

function PrimsAlgorithm( maze )
{
    MazeGeneration.call( this, maze );

    this._frontier = [ ];

    var r = Math.floor( Math.random() * this.maze.rows );
    var c = Math.floor( Math.random() * this.maze.columns );
    this.mark( r, c );
}
PrimsAlgorithm.prototype = Object.create( MazeGeneration.prototype );
PrimsAlgorithm.prototype.addFrontier = function( r, c )
{
    if( r >= 0 && r < this.maze.rows && c >= 0 && c < this.maze.columns && this.maze.get( r, c ) === 0 )
    {
        this.maze.set( r, c, this.maze.get( r, c ) | FRONTIER );
        this._frontier.push( new Cell( r, c ) );
    }
};
PrimsAlgorithm.prototype.mark = function( r, c )
{
    this.maze.set( r, c, this.maze.get( r, c ) | IN );
    this.addFrontier( r - 1, c );
    this.addFrontier( r, c - 1 );
    this.addFrontier( r + 1, c );
    this.addFrontier( r, c + 1 );
};
PrimsAlgorithm.prototype.inNeighbors = function( r, c )
{
    var n = [ ];
    if( c > 0 && ( this.maze.get( r, c - 1 ) & IN ) !== 0 )
    {
        n.push( new Cell( r, c - 1 ) );
    }
    if( c + 1 < this.maze.columns && ( this.maze.get( r, c + 1 ) & IN ) !== 0 )
    {
        n.push( new Cell( r, c + 1 ) );
    }
    if( r > 0 && ( this.maze.get( r - 1, c ) & IN ) !== 0 )
    {
        n.push( new Cell( r - 1, c ) );
    }
    if( r + 1 < this.maze.rows && ( this.maze.get( r + 1, c ) & IN ) !== 0 )
    {
        n.push( new Cell( r + 1, c ) );
    }
    return n;
};
PrimsAlgorithm.prototype.generateStep = function()
{
    if( this._frontier.length > 0 )
    {
        var cell = this._frontier.splice( Math.floor( Math.random() * this._frontier.length ), 1 )[ 0 ];
        var n = this.inNeighbors( cell.r, cell.c );
        var nCell = n[ Math.floor( Math.random() * n.length ) ];

        var dir = direction( cell.r, cell.c, nCell.r, nCell.c );
        this.maze.set( cell.r, cell.c, this.maze.get( cell.r, cell.c ) | dir );
        this.maze.set( nCell.r, nCell.c, this.maze.get( nCell.r, nCell.c ) | OPPOSITE[ dir ] );

        this.mark( cell.r, cell.c );
    }
    return this._frontier.length === 0;
};
PrimsAlgorithm.prototype.getFill = function( r, c )
{
    for( var i = 0; i < this._frontier.length; i++ )
    {
        var cell = this._frontier[ i ];
        if( r === cell.r && c === cell.c )
        {
            return "pink";
        }
    }
    if( this.maze.get( r, c ) === 0 )
    {
        return "#CCCCCC";
    }
    return "white";
};

function GrowingTree( maze )
{
    MazeGeneration.call( this, maze );

    var row = Math.floor( Math.random() * this.maze.rows );
    var col = Math.floor( Math.random() * this.maze.columns );
    this._cells = [ new Cell( row, col ) ];
}
GrowingTree.prototype = Object.create( MazeGeneration.prototype );
GrowingTree.prototype.nextIndex = function( method )
{
    var length = this._cells.length;
    if( method === "random" )
    {
        return Math.floor( Math.random() * length );
    }
    else if( method === "oldest" )
    {
        return 0;
    }
    else if( method === "newest" )
    {
        return length - 1;
    }
    else if( method === "middle" )
    {
        return Math.floor( length / 2 );
    }
    else
    {
        throw new Error( "' " + method + "' is not a valid index selection method." );
    }
};
GrowingTree.prototype.generateStep = function()
{
    if( this._cells.length > 0 )
    {
        var index = this.nextIndex( "newest" );
        var cell = this._cells[ index ];

        var directions = [ N, S, E, W ];
        directions.shuffle();
        for( var i = 0; i < directions.length; i++ )
        {
            var dir = directions[ i ];
            var nr = cell.r + DR[ dir ];
            var nc = cell.c + DC[ dir ];
            if( this.maze.get( nr, nc ) === 0 && this.maze.isValid( nr, nc ) )
            {
                this.maze.carve( cell.r, cell.c, dir );
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
GrowingTree.prototype.getFill = function( r, c )
{
    if( contains( this._cells, new Cell( r, c ) ) )
    {
        return "pink";
    }
    if( this.maze.get( r, c ) === 0 )
    {
        return "#CCCCCC";
    }
    return "white";
};

function Maze( rows, columns )
{
    this.rows = rows;
    this.columns = columns;
    this.done = false;

    this._maze = [ ];
    this._generation = new PrimsAlgorithm( this );
}
Maze.prototype.isValid = function( r, c )
{
    return 0 <= r && r < this.rows && 0 <= c && c < this.columns;
};
Maze.prototype.carve = function( r, c, direction )
{
    var nr = DR[ direction ] + r;
    var nc = DC[ direction ] + c;
    if( this.isValid( nr, nc ) )
    {
        this.or( r, c, direction );
        this.or( nr, nc, OPPOSITE[ direction ] );
        return true;
    }
    return false;
};
Maze.prototype.or = function( r, c, value )
{
    if( this.isValid( r, c ) )
    {
        this.set( r, c, this.get( r, c ) | value );
    }
};
Maze.prototype.generateStep = function()
{
    return this._generation.generateStep();
};
Maze.prototype.generate = function()
{
    while( !this.done )
    {
        this.done = this.generateStep();
    }
};
Maze.prototype.neighbors = function( r, c )
{
    var n = [ ];
    if( c > 0 && ( this.get( r, c ) & W ) === W )
    {
        n.push( new Cell( r, c - 1 ) );
    }
    if( c + 1 < this.columns && ( this.get( r, c ) & E ) === E )
    {
        n.push( new Cell( r, c + 1 ) );
    }
    if( r > 0 && ( this.get( r, c ) & N ) === N )
    {
        n.push( new Cell( r - 1, c ) );
    }
    if( r + 1 < this.rows && ( this.get( r, c ) & S ) === S )
    {
        n.push( new Cell( r + 1, c ) );
    }
    return n;
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
Maze.prototype.draw = function( ctx, getFillFunc )
{
    if( typeof getFillFunc !== "function" )
    {
        getFillFunc = ( function( generation )
        {
            return function( r, c )
            {
                return generation.getFill( r, c );
            }
        } )( this._generation );
    }

    var width = ctx.canvas.width;
    var height = ctx.canvas.height;
    var size = Math.min( width, height ) - 2 * padding;
    var xOffset = ( width - size ) / 2;
    var yOffset = ( height - size ) / 2;
    var width = size - ( this.columns + 1 ) * strokeWidth;
    var height = size - ( this.rows + 1 ) * strokeWidth;
    var cw = width / this.columns;
    var ch = height / this.rows;

    var y = yOffset;
    for( var r = 0; r < this.rows; r++ )
    {
        var x = xOffset;
        for( var c = 0; c < this.columns; c++ )
        {
            var color = getFillFunc( r, c );
            if( color !== null )
            {
                ctx.fillStyle = color;
                ctx.fillRect( x, y, cw + strokeWidth * 2, ch + strokeWidth * 2 );
            }
            x += cw + strokeWidth;
        }
        y += ch + strokeWidth;
    }

    ctx.strokeStyle = "black";
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    y = yOffset;
    for( var r = 0; r < this.rows; r++ )
    {
        var x = xOffset;
        for( var c = 0; c < this.columns; c++ )
        {
            var cell = this.get( r, c );
            if( ( cell & N ) !== N || r === 0 )
            {
                ctx.moveTo( x, y );
                ctx.lineTo( x + cw, y );
            }
            if( ( cell & W ) !== W || c === 0 )
            {
                ctx.moveTo( x, y );
                ctx.lineTo( x, y + ch );
            }
            x += cw + strokeWidth;
        }
        y += ch + strokeWidth;
    }
    ctx.moveTo( xOffset, y );
    ctx.lineTo( xOffset + size, y );

    ctx.moveTo( x, yOffset );
    ctx.lineTo( x, yOffset + size );

    ctx.stroke();
};
