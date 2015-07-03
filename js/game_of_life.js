/* Includes */

/// <reference path="utilities.js" />
/// <reference path="../typings/jquery/jquery.d.ts"/>

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );
context.translate( 0.5, 0.5 );

var widthInput = document.getElementById( "width" );
var widthGroup = document.getElementById( "widthGroup" );
var heightInput = document.getElementById( "height" );
var heightGroup = document.getElementById( "heightGroup" );
var timeInput = document.getElementById( "time" );
var timeGroup = document.getElementById( "timeGroup" );
var versionSelect = document.getElementById( "version" );
var updateButton = document.getElementById( "update" );
var editSettingsButton = document.getElementById( "editSettings" );

var playButton = document.getElementById( "play" );
playButton.classList.add( "inactive" );
var pauseButton = document.getElementById( "pause" );
var clearButton = document.getElementById( "clear" );

var bornCheckboxes = [ ];
var stayAliveCheckboxes = [ ];

for( var i = 1; i <= 8; i++ )
{
    bornCheckboxes[ i ] = document.getElementById( "b" + i.toString() );
    stayAliveCheckboxes[ i ] = document.getElementById( "s" + i.toString() );
}

$( ".collapse" ).collapse();

$( "#deadColor" ).colorpicker();
$( "#aliveColor" ).colorpicker();

function setSettingsFormState( version )
{
    versionSelect.value = version.name;
    var custom = version.custom;
    if( custom )
    {
        $( "#numbersCollapse" ).collapse( "show" );
    }
    else
    {
        $( "#numbersCollapse" ).collapse( "hide" );
    }
    for( var i = 1; i <= 8; i++ )
    {
        bornCheckboxes[ i ].checked = version.born[ i ];
        bornCheckboxes[ i ].disabled = !custom;
        stayAliveCheckboxes[ i ].checked = version.stayAlive[ i ];
        stayAliveCheckboxes[ i ].disabled = !custom;
    }
}

function onWindowResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    resizeBoard();
    render();
}

onDebouncedWindowResize( onWindowResize );


/* Validators */

validation.addValidator( widthInput, widthGroup, function( input )
{
    var num = Number( input.value );
    return isFinite( num ) && 0 < num;
} );

validation.addValidator( heightInput, heightGroup, function( input )
{
    var num = Number( input.value );
    return isFinite( num ) && 0 < num;
} );

validation.addValidator( timeInput, timeGroup, function( input )
{
    var num = Number( input.value );
    return isFinite( num ) && 0 < num;
} );


/* Versions */

var versions = {
    "Standard (B3/S23)": new Version( "Standard (B3/S23)", "B3/S23", false ),
    "Highlife (B36/S23)": new Version( "Highlife (B36/S23)", "B36/S23", false ),
    "Sierpinkski (B1/S12)": new Version( "Sierpinkski (B1/S12)", "B1/S12", false ),
    "Seeds (B2/S)": new Version( "Seeds (B2/S)", "B2/S", false ),
    "Custom": new Version( "Custom", "B/S", true )
};

function Version( name, versionString, custom )
{
    this.name = name;
    this.born = [ ];
    this.stayAlive = [ ];
    this.custom = custom == true;

    this.nextState = function( neighbors, currentState )
    {
        if( version.born[ neighbors ] )
        {
            return alive;
        }
        else if( version.stayAlive[ neighbors ] )
        {
            return currentState;
        }
        else
        {
            return dead;
        }
    };

    versionString = removeAllWhiteSpace( versionString );
    var bMatches = versionString.match( /^[Bb](\d*)\// );
    if( bMatches && bMatches.length == 2 )
    {
        var bNums = bMatches[ 1 ];
        for( var i = 0; i < bNums.length; i++ )
        {
            this.born[ Number( bNums[ i ] ) ] = true;
        }
    }
    var sMatches = versionString.match( /[Ss](\d*)$/ );
    if( sMatches && sMatches.length == 2 )
    {
        var sNums = sMatches[ 1 ];
        for( var i = 0; i < sNums.length; i++ )
        {
            this.stayAlive[ Number( sNums[ i ] ) ] = true;
        }
    }
    for( var i = 0; i <= 8; i++ )
    {
        if( this.born[ i ] === undefined )
        {
            this.born[ i ] = false;
        }
        if( this.stayAlive[ i ] === undefined )
        {
            this.stayAlive[ i ] = false;
        }
    }
}


/* Board */

var dead = 0;
var alive = 1;

var boardColors = [ "gray", "black" ];

var board = new Board( 0, 0 );

function Board( rows, columns )
{
    this.board = [ ];
    this.rows = rows === undefined ? 0 : rows;
    this.columns = columns === undefined ? 0 : columns;

    this.resize = function( rows, columns )
    {
        this.rows = rows;
        this.columns = columns;
    };
    this.get = function( row, column )
    {
        // Check row for wrap around
        if( row < 0 )
        {
            row = this.rows + row;
        }
        else if( row >= this.rows )
        {
            row = row % this.rows;
        }
        // Check if row exists
        if( this.board[ row ] === undefined )
        {
            return 0;
        }
        // Check column for wrap around
        if( column < 0 )
        {
            column = this.columns + column;
        }
        else if( column >= this.columns )
        {
            column = column % this.columns;
        }
        // Check if column exists
        if( this.board[ row ][ column ] === undefined )
        {
            return 0;
        }
        // Get value
        return this.board[ row ][ column ];
    };
    this.set = function( row, column, value )
    {
        // Check row for wrap around
        if( row < 0 )
        {
            row = this.rows + row;
        }
        else if( row >= this.rows )
        {
            row = row % this.rows;
        }
        // Check column for wrap around
        if( column < 0 )
        {
            column = this.columns + column;
        }
        else if( column >= this.columns )
        {
            column = column % this.columns;
        }
        // Check if row exists
        if( this.board[ row ] === undefined )
        {
            this.board[ row ] = [ ];
        }
        // Set value
        this.board[ row ][ column ] = value;
    };
}

function resizeBoard()
{
    var rows = Math.ceil( canvas.height / cellHeight );
    var columns = Math.ceil( canvas.width / cellWidth );

    board.resize( rows, columns );
}


/* Update */

var paused = false;
var timePassed = 0;

function update( elapsedTime )
{
    if( paused )
    {
        return;
    }
    timePassed += elapsedTime * 1000;
    if( timePassed > iterationDelay )
    {
        timePassed = 0;
        updateBoard();
    }
    render();
}

function updateBoard()
{
    var rows = board.rows;
    var columns = board.columns;
    var neighborsBoard = new Board( rows, columns );
    for( var r = 0; r < rows; r++ )
    {
        for( var c = 0; c < columns; c++ )
        {
            var center = board.get( r, c );
            for( var rr = r - 1; rr <= r + 1; rr++ )
            {
                for( var cc = c - 1; cc <= c + 1; cc++ )
                {
                    if( rr == r && cc == c )
                    {
                        continue;
                    }
                    neighborsBoard.set( rr, cc, neighborsBoard.get( rr, cc ) + center );
                }
            }
        }
    }
    for( var r = 0; r < rows; r++ )
    {
        for( var c = 0; c < columns; c++ )
        {
            var neighbors = neighborsBoard.get( r, c );
            var currentState = board.get( r, c );
            board.set( r, c, version.nextState( neighbors, currentState ) );
        }
    }
}

/* Input */

canvas.addEventListener( "pointerup", function( e )
{
    var p = getRelativeCoordinates( e );
    var row = Math.floor( p.y / cellHeight );
    var column = Math.floor( p.x / cellWidth );
    board.set( row, column, alive );
    render();
} );

playButton.onclick = function()
{
    playButton.classList.add( "inactive" );
    pauseButton.classList.remove( "inactive" );
    paused = false;
};

pauseButton.onclick = function()
{
    playButton.classList.remove( "inactive" );
    pauseButton.classList.add( "inactive" );
    paused = true;
};

versionSelect.addEventListener( "input", function()
{
    setSettingsFormState( versions[ versionSelect.value ] );
} );

updateButton.addEventListener( "click", function()
{
    if( validation.allValid() )
    {
        $( "#controlsModal" ).modal( "hide" );
        cellWidth = Number( widthInput.value );
        cellHeight = Number( heightInput.value );
        iterationDelay = Number( timeInput.value ) * 1000;

        boardColors[ alive ] = $( "#aliveColor" ).colorpicker( "getValue", "black" );
        boardColors[ dead ] = $( "#deadColor" ).colorpicker( "getValue", "gray" );

        version = versions[ versionSelect.value ];
        if( version.custom )
        {
            for( var i = 1; i <= 8; i++ )
            {
                version.born[ i ] = bornCheckboxes[ i ].checked;
                version.stayAlive[ i ] = stayAliveCheckboxes[ i ].checked;
            }
        }
        resizeBoard();
    }
} );

clearButton.addEventListener( "click", function()
{
    board = new Board( board.rows, board.columns );
    render();
} );


/* Rendering */

function render()
{
    context.save();
    context.setTransform( 1, 0, 0, 1, 0, 0 );
    context.fillStyle = boardColors[ dead ];
    context.fillRect( 0, 0, canvas.width, canvas.height );
    context.restore();

    context.fillStyle = boardColors[ alive ];
    var x = 0;
    var y = 0;
    for( var r = 0; r < board.rows; r++ )
    {
        for( var c = 0; c < board.columns; c++ )
        {
            if( board.get( r, c ) == alive )
            {
                context.fillRect( x, y, cellWidth, cellHeight );
            }
            x += cellWidth;
        }
        y += cellHeight;
        x = 0;
    }
}

/* Variables */

var cellWidth = 10;
var cellHeight = 10;
var iterationDelay = 200;
var version;


/* Main */
( function()
{
    version = versions[ Object.keys( versions )[ 0 ] ];
    setSettingsFormState( version );
    widthInput.value = cellWidth;
    heightInput.value = cellHeight;
    timeInput.value = iterationDelay / 1000;

    onWindowResize();
    startAnimation( update, function() { } );
} )();
