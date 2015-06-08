/* Document Elements */

var boardCanvas = document.getElementById( "boardCanvas" );
var boardContext = boardCanvas.getContext( "2d" );
boardContext.translate( 0.5, 0.5 );

var moveQueue = document.getElementById( "moveQueue" );
var possibleMoveQueue = document.getElementById( "possibleMoveQueue" );

var startButton = document.getElementById( "start" );
var stopButton = document.getElementById( "stop" );
var resetButton = document.getElementById( "reset" );

function setSizes()
{
    boardCanvas.width = boardStyle.width;
    boardCanvas.height = boardStyle.height;
}


/* Images */

function getImageSrcForPlayer( facing )
{
    switch( facing )
    {
        case facingDown:
            return "images/PlayerDown.png";
        case facingUp:
            return "images/PlayerUp.png";
        case facingLeft:
            return "images/PlayerLeft.png";
        case facingRight:
            return "images/PlayerRight.png";
        default:
            return "";
    }
}

function getImageSrcForMove( move )
{
    switch( move )
    {
        case turnLeftMove:
            return "images/TurnLeft.png";
        case turnRightMove:
            return "images/TurnRight.png";
        case forwardMove:
            return "images/MoveForward.png";
        case lightUpMove:
            return "images/LightUp.png";
        default:
            return "";
    }
}


/* Game Board */

var board = null;

var boardWidth = 500;
var boardHeight = 500;

var boardRows = 10;
var boardColumns = 10;

var cellEmpty = 0;
var cellUnlitLight = 1;
var cellLitLight = 2;

var emptyColor = "#669999";
var unlitLightColor = "#99FAFF";
var litLightColor = "#FFFF00";

var boardStartX = 0;
var boardStartY = 0;
var boardBorderThickness = 1;
var boardCellWidth = ( boardWidth - boardBorderThickness * ( boardColumns - 1 ) ) / boardColumns;
var boardCellHeight = ( boardHeight - boardBorderThickness * ( boardRows - 1 ) ) / boardRows;

var boardStyle = getBoardStyle();

var lightLocation;

function initializeBoard()
{
    board = [ ];
    for( var r = 0; r < boardRows; r++ )
    {
        board[ r ] = [ ];
        for( var c = 0; c < boardColumns; c++ )
        {
            board[ r ][ c ] = cellEmpty;
        }
    }
    var lightRow = Math.floor( Math.random() * boardRows );
    var lightColumn = Math.floor( Math.random() * boardColumns );
    lightLocation = new Location( lightRow, lightColumn );
    resetBoard();
}

function resetBoard()
{
    board[ lightLocation.row ][ lightLocation.column ] = cellUnlitLight;
}

function drawBoardCell( row, column )
{
    var x = boardStyle.left + ( boardCellWidth + boardBorderThickness ) * column;
    var y = boardStyle.top + ( boardCellHeight + boardBorderThickness )  * row;
    var cell = board[ row ][ column ];
    if( cell == cellEmpty )
    {
        boardContext.fillStyle = emptyColor;
        boardContext.fillRect( x, y, boardCellWidth, boardCellHeight );
    }
    else if( cell == cellUnlitLight )
    {
        boardContext.fillStyle = unlitLightColor;
        boardContext.fillRect( x, y, boardCellWidth, boardCellHeight );
    }
    else if( cell == cellLitLight )
    {
        boardContext.fillStyle = litLightColor;
        boardContext.fillRect( x, y, boardCellWidth, boardCellHeight );
    }
}

function drawBoard()
{
    for( var r = 0; r < boardRows; r++ )
    {
        for( var c = 0; c < boardColumns; c++ )
        {
            drawBoardCell( r, c );
        }
    }
}

function getBoardStyle()
{
    var left = boardStartX;
    var top = boardStartY;
    var right = left + boardWidth;
    var bottom = top + boardHeight;
    return {
        left: left,
        right: right,
        top: top,
        bottom: bottom,
        width: boardWidth,
        height: boardHeight
    };
}


/* Player */

var facingUp = 0;
var facingRight = 1;
var facingDown = 2;
var facingLeft = 3;

function Location( row, column )
{
    this.row = row;
    this.column = column;
    this.offsetLocation = function( facing )
    {
        var moveArray = moveArrays[ facing ];
        return new Location( this.row + moveArray.vert, this.column + moveArray.horiz );
    };
    this.isValid = function()
    {
        return 0 <= this.row && this.row < boardRows && 0 <= this.column && this.column < boardColumns;
    };
}

var playerFacing;
var playerLocation;
var playerImg = createPlayerImage();

function createPlayerImage()
{
    var img = document.createElement( "img" );
    img.className = "player";
    img.width = boardCellWidth;
    img.height = boardCellHeight;
    document.body.appendChild( img );
    return img;
}

function updatePlayerImg()
{
    var left = boardStyle.left + playerLocation.column * ( boardCellWidth + boardBorderThickness );
    var top = boardStyle.top + playerLocation.row * ( boardCellHeight + boardBorderThickness );
    playerImg.style.left = left + "px";
    playerImg.style.top = top + "px";
    playerImg.src = getImageSrcForPlayer( playerFacing );
}

function initializePlayer()
{
    playerFacing = facingDown;
    playerLocation = new Location( 0, 0 );
    updatePlayerImg();
}


/* Moves */

var turnLeftMove = 0;
var turnRightMove = 1;
var forwardMove = 2;
var lightUpMove = 3;

var moves = [ ];
var possibleMoves = [ turnLeftMove, turnRightMove, forwardMove, lightUpMove ];

var moveButtons = [ ];

var currentMoveIndex = -1;

function MoveArray( deltaVert, deltaHoriz )
{
    this.vert = deltaVert;
    this.horiz = deltaHoriz;
}

var moveArrays = [];
moveArrays[ facingUp ] = new MoveArray( -1, 0 );
moveArrays[ facingDown ] = new MoveArray( 1, 0 );
moveArrays[ facingLeft ] = new MoveArray( 0, -1 );
moveArrays[ facingRight ] = new MoveArray( 0, 1 );

function executeMoveForward()
{
    var newLocation = playerLocation.offsetLocation( playerFacing );
    if( newLocation.isValid() )
    {
        playerLocation = newLocation;
    }
}

function executeTurnLeft()
{
    switch( playerFacing )
    {
        case facingUp:
            playerFacing = facingLeft;
            break;
        case facingDown:
            playerFacing = facingRight;
            break;
        case facingLeft:
            playerFacing = facingDown;
            break;
        case facingRight:
            playerFacing = facingUp;
            break;
    }
}

function executeTurnRight()
{
    switch( playerFacing )
    {
        case facingUp:
            playerFacing = facingRight;
            break;
        case facingDown:
            playerFacing = facingLeft;
            break;
        case facingLeft:
            playerFacing = facingUp;
            break;
        case facingRight:
            playerFacing = facingDown;
            break;
    }
}

function executeLightUp()
{
    if( board[ playerLocation.row ][ playerLocation.column ] == cellUnlitLight )
    {
        board[ playerLocation.row ][ playerLocation.column ] = cellLitLight;
    }
}

function executeMove( move )
{
    switch( move )
    {
        case turnLeftMove:
            executeTurnLeft();
            break;

        case turnRightMove:
            executeTurnRight();
            break;

        case forwardMove:
            executeMoveForward();
            break;

        case lightUpMove:
            executeLightUp();
            break;
    }
}

var moveInterval = null;
var moveExecutionDelay = 1000;
var lastMoveButton;

function executeMoves()
{
    stopExecution();
    initializePlayer();
    moveInterval = setInterval( function()
    {
        if( lastMoveButton && lastMoveButton.classList.contains( "currentMove" ) )
        {
            lastMoveButton.classList.remove( "currentMove" );
        }

        if( currentMoveIndex >= moves.length )
        {
            stopExecution();
            return;
        }

        lastMoveButton = moveButtons[ currentMoveIndex ];
        lastMoveButton.classList.add( "currentMove" );

        executeMove( moves[ currentMoveIndex ] );
        currentMoveIndex++;
        render();
    }, moveExecutionDelay );
    render();
}

function stopExecution()
{
    clearInterval( moveInterval );
    moveInterval = null;
    currentMoveIndex = 0;
    render();
}

function addMove( move )
{
    moves.push( move );
    moveButtons.push( addMoveButton( moveQueueParams, move ) );
}

function clearMoves()
{
    for( var i = 0; i < moveButtons.length; i++ )
    {
        moveButtons[ i ].parentNode.removeChild( moveButtons[ i ] );
    }
    moves = [ ];
    moveButtons = [ ];
}


/* Move Renderer */

function addMoveButton( params, move )
{
    var button = document.createElement( "input" );
    button.type = "image";
    button.classList.add( "baseMoveButton" );
    button.classList.add( params.moveButtonClass );
    button.disabled = params.moveButtonsDisabled;
    button.src = getImageSrcForMove( move );
    params.parentElement.appendChild( button );
    return button;
}


/* Move Queue */

var moveQueueParams = {
    parentElement: moveQueue,
    showCurrent: true,
    moveButtonClass: "moveButton",
    moveButtonsDisabled: true
};

var possibleMoveQueueParams = {
    parentElement: possibleMoveQueue,
    showCurrent: false,
    moveButtonClass: "possibleMoveButton",
    moveButtonsDisabled: false
};

function createOnPossibleMoveClick( move )
{
    return function()
    {
        addMove( move );
    };
}

function initializePossibleMovesQueue()
{
    for( var i = 0; i < possibleMoves.length; i++ )
    {
        var button = addMoveButton( possibleMoveQueueParams, possibleMoves[ i ] );
        button.onclick = createOnPossibleMoveClick( possibleMoves[ i ] );
    }
}


/* Buttons */

function onExecuteClick()
{
    executeMoves();
    render();
}

function onStopClick()
{
    stopExecution();
    render();
}

function onResetClick()
{
    stopExecution();
    initializePlayer();
    resetBoard();
    clearMoves();
    render();
}

function initializeControlButtons()
{
    startButton.onclick = onExecuteClick;

    stopButton.onclick = onStopClick;

    resetButton.onclick = onResetClick;
}


/* Rendering */

function render()
{
    clear( context );
    drawBoard();
    updatePlayerImg();
}


/* Main */

function main()
{
    setSizes();
    initializeBoard();
    initializePlayer();
    initializePossibleMovesQueue();
    initializeControlButtons();
    render();
}

main();
