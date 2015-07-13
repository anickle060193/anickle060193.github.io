/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />
/// <reference path="maze_generation.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var rowsInput = document.getElementById( "rows" );
var columnsInput = document.getElementById( "columns" );

var generateButton = document.getElementById( "generate" );

var animateButton = document.getElementById( "animate" );
var animateIcon = document.getElementById( "animateIcon" );
var iterationDelayInput = document.getElementById( "iterationDelay" );

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


/* A* */

var astar = null;

function Astar( maze, start, goal )
{
    this.maze = maze;
    this.maze.generate();

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
    if( this.openset.length === 0 )
    {
        this.done = true;
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
    if( this.current && cell.equals( this.current ) )
    {
        return "red";
    }
    if( cell.equals( this.start ) )
    {
        return "blue";
    }
    if( cell.equals( this.goal ) )
    {
        return "green";
    }
    if( contains( this.path, cell ) )
    {
        return "pink";
    }
    if( contains( this.openset, cell ) )
    {
        return "#888888";
    }
    if( contains( this.closedset, cell ) )
    {
        var r = Math.max( this.start.r, this.maze.rows - this.start.r - 1 );
        var c = Math.max( this.start.c, this.maze.columns - this.start.c - 1 );
        var dist = this.distance( this.start, new Cell( r, c ) );
        var currDist = this.distance( this.start, cell );
        var color = HSVtoRGB( currDist / dist, 0.85, 0.75 );
        return color;
    }
    return null;
};
Astar.prototype.draw = function()
{
    this.maze.draw( context, ( function( astar )
    {
        return function( r, c )
        {
            return astar.getFill( r, c );
        }
    } )( this ) );
};

function generate()
{
    var rows = Number( rowsInput.value );
    var columns = Number( columnsInput.value );
    var maze = new Maze( rows, columns );
    astar = new Astar( maze, new Cell( 0, 0 ), new Cell( rows - 1, columns - 1 ) );
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

animateButton.addEventListener( "click", function()
{
    paused = !paused;
    if( !paused )
    {
        animateButton.classList.remove( "btn-success" );
        animateButton.classList.add( "btn-danger" );
        animateIcon.classList.remove( "glyphicon-play" );
        animateIcon.classList.add( "glyphicon-stop" );
    }
    else
    {
        animateButton.classList.add( "btn-success" );
        animateButton.classList.remove( "btn-danger" );
        animateIcon.classList.add( "glyphicon-play" );
        animateIcon.classList.remove( "glyphicon-stop" );
    }
} );

iterationDelayInput.addEventListener( "change", function()
{
    var num = Number( iterationDelayInput.value );
    if( isFinite( num ) && num > 0 )
    {
        iterationDelay = num;
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

var paused = false;
var iterationDelay = 0.05;

var t = 0;

function update( elapsedTime )
{
    if( !paused )
    {
        t += elapsedTime;
        if( t > iterationDelay )
        {
            astar.searchStep();
            t = 0;
        }
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
