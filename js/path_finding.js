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

function indexOf( arr, value )
{
    for( var i = 0; i < arr.length; i++ )
    {
        if( value.equals( arr[ i ] ) )
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
    var r = Math.floor( Math.random() * this.maze.rows );
    var c = Math.floor( Math.random() * this.maze.columns );
    this.mark( r, c );

    while( this._frontier.length > 0 )
    {
        var cell = this._frontier.splice( Math.floor( Math.random() * this._frontier.length ), 1 )[ 0 ];
        var n = this.neighbors( cell.r, cell.c );
        var nCell = n[ Math.floor( Math.random() * n.length ) ];

        var dir = direction( cell.r, cell.c, nCell.r, nCell.c );
        this.maze.set( cell.r, cell.c, this.maze.get( cell.r, cell.c ) | dir );
        this.maze.set( nCell.r, nCell.c, this.maze.get( nCell.r, nCell.c ) | OPPOSITE[ dir ] );

        this.mark( cell.r, cell.c );
    }
};

function Maze( rows, columns )
{
    this.rows = rows;
    this.columns = columns;

    this._maze = [ ];
    new MazeGeneration( this ).generate();
}
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


/* A* */

var astar = null;

function Astar( maze, start, goal )
{
    this.maze = maze;
    this.start = start;
    this.goal = goal;
    this.done = false;

    this.path = [ ];
    this.current = null;
    this.closedset = [ ];
    this.openset = [ this.start ];
    this.cameFrom = new HashMap();

    this.gScore = new HashMap();
    this.gScore.put( this.start, 0 );

    this.fScore = new HashMap();
    this.fScore.put( this.start, 0 + this.heuristic( this.start, this.goal ) );
}
Astar.prototype.lowestFScore = function()
{
    var minScore = Number.MAX_VALUE;
    var node = null;
    for( var i = 0; i < this.openset.length; i++ )
    {
        var f = this.fScore.get( this.openset[ i ] );
        if( f < minScore )
        {
            minScore = f;
            node = this.openset[ i ];
        }
    }
    return node;
};
Astar.prototype.searchStep = function()
{
    if( !this.done && this.openset.length !== 0 )
    {
        this.current = this.lowestFScore();
        this.path = this.reconstructPath( this.current );
        if( this.current.equals( this.goal ) )
        {
            //this.path = this.reconstructPath( this.goal );
            this.done = true;
            return;
        }

        remove( this.openset, this.current );
        this.closedset.push( this.current );
        var neighbors = this.maze.neighbors( this.current.r, this.current.c );
        for( var i = 0; i < neighbors.length; i++ )
        {
            var neighbor = neighbors[ i ];
            if( contains( this.closedset, neighbor ) )
            {
                continue;
            }
            var tentativeGScore = this.gScore.get( this.current ) + this.distance( this.current, neighbor );

            if( !contains( this.openset, neighbor ) || tentativeGScore < this.gScore.get( neighbor ) )
            {
                this.cameFrom.put( neighbor, this.current );
                this.gScore.put( neighbor, tentativeGScore );
                this.fScore.put( neighbor, this.gScore.get( neighbor ) + this.heuristic( neighbor, this.goal ) );
                if( !contains( this.openset, neighbor ) )
                {
                    this.openset.push( neighbor );
                }
            }
        }
    }
};
Astar.prototype.reconstructPath = function( current )
{
    var path = [ current ];
    while( this.cameFrom.get( current ) !== undefined )
    {
        current = this.cameFrom.get( current );
        path.push( current );
    }
    return path;
}
Astar.prototype.distance = function( n1, n2 )
{
    var rDiff = n1.r - n2.r;
    var cDiff = n1.c - n2.c;
    return Math.sqrt( rDiff * rDiff + cDiff * cDiff );
};
Astar.prototype.heuristic = function( n1, n2 )
{
    return this.distance( n1, n2 );
};
Astar.prototype.getFill = function( r, c )
{
    var cell = new Cell( r, c );
    if( this.current !== null && cell.equals( this.current ) )
    {
        return "red";
    }
    if( cell.equals( this.start ) )
    {
        return "#CCCCFF";
    }
    if( cell.equals( this.goal ) )
    {
        return "#CCFFCC";
    }
    if( contains( this.path, cell ) )
    {
        return "pink";
    }
    return "white";
};
Astar.prototype.draw = function()
{
    var size = Math.min( canvas.width, canvas.height ) - 2 * padding;
    var xOffset = ( canvas.width - size ) / 2;
    var yOffset = ( canvas.height - size ) / 2;
    var width = size - ( this.maze.columns + 1 ) * strokeWidth;
    var height = size - ( this.maze.rows + 1 ) * strokeWidth;
    var cw = width / this.maze.columns;
    var ch = height / this.maze.rows;

    context.strokeStyle = "black";
    var y = yOffset;
    for( var r = 0; r < this.maze.rows; r++ )
    {
        var x = xOffset;
        for( var c = 0; c < this.maze.columns; c++ )
        {
            context.fillStyle = this.getFill( r, c );
            context.fillRect( x, y, cw + strokeWidth * 2, ch + strokeWidth * 2 );

            var cell = this.maze.get( r, c );
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
    var maze = new Maze( rows, columns );
    astar = new Astar( maze, new Cell( 0, 0 ), new Cell( 10, 10 ) );
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

    if( astar != null )
    {
        astar.draw();
    }
}


/* Animation */

var delay = 0.1;
var t = 0;
function update( elapsedTime )
{
    t += elapsedTime;
    if( t > delay )
    {
        astar.searchStep();
        t = 0;
    }
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
