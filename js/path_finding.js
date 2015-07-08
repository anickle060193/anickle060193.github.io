/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

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
}function indexOf( arr, value )
{
    for( var i = 0; i < arr.length; i++ )
    {
        if( arr[ i ] === value )
        {
            return i;
        }
    }
    return -1;
}

function contains( arr, value )
{
    return indexOf( arr, value ) !== -1;
}

function remove( arr, value )
{
    var i = indexOf( arr, value );
    if( i >= 0 )
    {
        return arr.splice( i, 1 )[ 0 ];
    }
    else
    {
        return null;
    }
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

function MazeGeneration( maze )
{
    this.maze = maze;

    this._frontier = [ ];

    var r = Math.floor( Math.random() * this.rows );
    var c = Math.floor( Math.random() * this.columns );
    this.mark( r, c );
    this.generate();
}
MazeGeneration.prototype.addFrontier = function( r, c )
{
    if( r >= 0 && r < this.maze.rows && c >= 0 && c < this.maze.columns && this.maze.get( r, c ) === 0 )
    {
        this.maze.set( r, c, this.maze.get( r, c ) | FRONTIER );
        this._frontier.push( new Cell( r, c ) );
    }
};
MazeGeneration.prototype.mark = function( r, c )
{
    this.maze.set( r, c, this.maze.get( r, c ) | IN );
    this.addFrontier( r - 1, c );
    this.addFrontier( r, c - 1 );
    this.addFrontier( r + 1, c );
    this.addFrontier( r, c + 1 );
};
MazeGeneration.prototype.neighbors = function( r, c )
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
MazeGeneration.prototype.generate = function()
{
    while( this._frontier.length > 0 )
    {
        var cell = this._frontier.splice( Math.floor( Math.random() * this._frontier.length ), 1 )[ 0 ];
        var n = this.neighbors( cell.r, cell.c );
        var nCell = n[ Math.floor( Math.random() * n.length ) ];

        var dir = direction( cell.r, cell.c, nCell.r, nCell.c );
        this.set( cell.r, cell.c, this.get( cell.r, cell.c ) | dir );
        this.set( nCell.r, nCell.c, this.get( nCell.r, nCell.c ) | OPPOSITE[ dir ] );

        this.mark( cell.r, cell.c );
    }
};

var maze = null;

function Maze( rows, columns )
{
    this.rows = rows;
    this.columns = columns;

    this.done = false;

    this._maze = [ ];
    new MazeGeneration( this ).generate();
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
Maze.prototype.neighbors = function( r, c )
{
    var n = [ ];
    if( c > 0 && ( this.get( r, c - 1 ) & W ) === W )
    {
        n.push( new Cell( r, c - 1 ) );
    }
    if( c + 1 < this.columns && ( this.get( r, c + 1 ) & E ) === E )
    {
        n.push( new Cell( r, c + 1 ) );
    }
    if( r > 0 && ( this.get( r - 1, c ) & N ) === N )
    {
        n.push( new Cell( r - 1, c ) );
    }
    if( r + 1 < this.rows && ( this.get( r + 1, c ) & S ) === S )
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


/* A* */

function A*( start, goal )
{
    var closedset = [ ];
    var openset = [ start ];
    var cameFrom = { };

    var gScore = { };
    gScore[ start ] = 0;

    var fScore = { };
    fScore[ start ] = gScore[ start ] + heuristic( start, goal );

    function lowestFScore()
    {
        var minScore = Number.MAX_VALUE;
        var node = null;
        for( var i = 0; i < openset.length; i++ )
        {
            var f = fScore[ openset[ i ] ];
            if( f < minScore )
            {
                minScore = f;
                node = openset[ i ];
            }
        }
        return key;
    }

    while( closedset.length > 0 )
    {
        var current = lowestFScore();
        if( current === goal )
        {
            return reconstructPath( cameFrom, goal );
        }

        remove( openset, current );
        closedset.push( current );
        for( var neighbor in neighbors( current ) )
        {
            if( contains( closedset, neighbor ) )
            {
                continue;
            }
            var tentativeGScore = gScore[ current ] + distBetween( current, neighbor );

            if( !contains( openset, neighbor ) || tentativeGScore < gScore[ neighbor ] )
            {
                cameFrom[ neighbor ] = current;
                gScore[ neighbor ] = tentativeGScore;
                fScore[ neighbor ] = gScore[ neighbor ] + heuristic( neighbor, goal );
                if( !contains( openset, neighbor ) )
                {
                    openset.push( neighbor );
                }
            }
        }
    }
    return null;
}

function reconstructPath( cameFrom, current )
{
    var path = [ current ];
    while( cameFrom[ current ] !== undefined )
    {
        current = cameFrom[ current ];
        path.push( current );
    }
    return path;
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
