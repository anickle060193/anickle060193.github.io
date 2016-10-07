/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var widthInput = document.getElementById( "width" );
var heightInput = document.getElementById( "height" );
var bombsInput = document.getElementById( "bombs" );

var startButton = document.getElementById( "start" );
var randomButton = document.getElementById( "random" );

var contentDiv = document.getElementById( "content" );

/* Validation */

var display = new ValidationGroup();

function setupDisplayValidators()
{
    var bombValidator = display.addValidator( bombsInput, function( input )
    {
        var bombs = getBombsInput();
        var width = getWidthInput();
        var height = getHeightInput();
        return isFinite( bombs ) && bombs >= 1 && bombs < width * height;
    } );
    display.addValidator( widthInput, function( input )
    {
        var width = getWidthInput();
        return isFinite( width ) && width >= 2;
    } );
    display.addValidator( heightInput, function( input )
    {
        var height = getHeightInput();
        return isFinite( height ) && height >= 2;
    } );

    widthInput.addEventListener( "input", function()
    {
        bombValidator.updateValidity();
    } );
    heightInput.addEventListener( "input", function()
    {
        bombValidator.updateValidity();
    } );
}


/* Minesweeper */

var rows = 0;
var columns = 0;
var bombs = 0;
var table = null;
var firstClick = true;
var gameOver = false;
var flagsRemaning = 0;
var flaggedBombs = 0;
var board = [ ]

function startGame()
{
    rows = getHeightInput();
    columns = getWidthInput();
    bombs = getBombsInput();

    createHTMLBoard();

    firstClick = true;
    gameOver = false;
    flagsRemaning = 0;
    flaggedBombs = 0;
}

function createHTMLBoard()
{
    while( contentDiv.firstChild )
    {
        contentDiv.removeChild( contentDiv.firstChild );
    }

    table = document.createElement( "table" );
    table.id = "minefield";

    for( var r = 0; r < rows; r++ )
    {
        var row = document.createElement( "tr" );
        for( var c = 0; c < columns; c++ )
        {
            var cell = document.createElement( "td" );
            cell.classList.add( "cell", "closed" );
            cell.addEventListener( "click", createCellClickEvent( r, c, cell ) );
            cell.oncontextmenu = cancelContextMenu;
            row.appendChild( cell );
        }

        table.appendChild( row );
    }
    contentDiv.appendChild( table );
}

function cancelContextMenu()
{
    return false;
}

function Cell( r, c, tableCell )
{
    this.row = r;
    this.col = c;
    this.tableCell = tableCell;
    this.open = false;
    this.bomb = false;
    this.bombValue = 0;
    this.flagged = false;
}

function createInternalBoard( row, col )
{
    board = [ ];

    var cells = [ ];
    for( var r = 0; r < rows; r++ )
    {
        var boardRow = [ ];
        board.push( boardRow );

        for( var c = 0; c < columns; c++ )
        {
            var tableCell = table.children[ r ].children[ c ];
            boardRow.push( new Cell( r, c, tableCell ) );

            if( r != row || c != col )
            {
                cells.push( [ r, c ] );
            }
        }
    }
    cells.shuffle();

    for( var i = 0; i < bombs; i++ )
    {
        var bombCell = cells.shift();
        var bR = bombCell[ 0 ];
        var bC = bombCell[ 1 ];
        board[ bR ][ bC ].bomb = true;
        for( var r = Math.max( 0, bR - 1 ); r <= Math.min( bR + 1, rows - 1 ); r++ )
        {
            for( var c = Math.max( 0, bC - 1 ); c <= Math.min( bC + 1, columns - 1 ); c++ )
            {
                if( r != bR || c != bC )
                {
                    board[ r ][ c ].bombValue++;
                }
            }
        }
    }
}

function createCellClickEvent( row, col, cell )
{
    return function( event )
    {
        if( gameOver )
        {
            return;
        }

        if( event.which == 1 )
        {
            if( !cell.flagged )
            {
                if( firstClick )
                {
                    firstClick = false;

                    createInternalBoard( row, col );
                }

                spreadOpen( row, col, cell );
            }
        }
        else if( event.which == 3 )
        {
            flagCell( cell );
        }
    };
}

function spreadOpen( row, col, cell )
{
    if( cell.open || cell.flagged )
    {
        return;
    }

    openCell( cell );

    if( cell.bomb )
    {
        endGame();
    }
    else
    {
        if( cell.bombValue == 0 )
        {
            for( var rr = Math.max( 0, row - 1 ); rr <= Math.min( row + 1, rows - 1 ); rr++ )
            {
                for( var cc = Math.max( 0, col - 1 ); cc <= Math.min( col + 1, columns - 1 ); cc++ )
                {
                    spreadOpen( rr, cc );
                }
            }
        }
    }
}

function openCell( cell )
{
    cell.open = true;
    cell.tableCell.classList.remove( "closed" );

    if( cell.bomb )
    {
        cell.tableCell.classList.add( "open_bomb" );
    }
    else
    {
        cell.tableCell.classList.add( "open" );
        if( cell.bombValue != 0 )
        {
            cell.tableCell.appendChild( createBombValueElement( cell.bombValue ) );
        }
    }
}

function createBombValueElement( bombValue )
{
    var p = document.createElement( "p" );
    p.textContent = bombValue;
    p.classList.add( "bombValue" );
    p.classList.add( "bombValue_" + bombValue );
    return p;
}

function flagCell( cell )
{
    if( !cell.open )
    {
        cell.flagged = !cell.flagged;
        if( cell.flagged )
        {
            cell.tableCell.classList.add( "flagged" );
        }
        else
        {
            cell.tableCell.classList.remove( "flagged" );
        }
    }
}

function endGame()
{
    gameOver = true;

    for( var r = 0; r < rows; r++ )
    {
        for( var c = 0; c < columns; c++ )
        {
            var cell = board[ r ][ c ];
            if( cell.bomb && !cell.open )
            {
                cell.tableCell.classList.remove( "closed" );
                cell.tableCell.classList.add( "closed_bomb" );
            }
        }
    }
}


/* Input */

function getWidthInput()
{
    return Number( widthInput.value );
}

function getHeightInput()
{
    return Number( heightInput.value );
}

function getBombsInput()
{
    return Number( bombsInput.value );
}

startButton.addEventListener( "click", function()
{
    if( display.allValid() )
    {
        $( ".modal" ).modal( "hide" );

        startGame();
    }
} );

randomButton.addEventListener( "click", function()
{
} );


/* Main */

( function()
{
    setupDisplayValidators();
} )();