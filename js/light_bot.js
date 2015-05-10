/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );
context.translate( 0.5, 0.5 );

function resize()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    render();
}

var resizeTimer;
addEventListener( "resize", function()
{
    clearTimeout( resizeTimer );
    resizeTimer = setTimeout( resize, 250 );
} );


/* Images */

var playerDownImage = 0;
var playerUpImage = 1;
var playerLeftImage = 2;
var playerRightImage = 3;

var imageFileNames = [
    "images/PlayerDown.png",
    "images/PlayerUp.png",
    "images/PlayerLeft.png",
    "images/PlayerRight.png"
];

var images = [ ];

function onLoadingComplete( image )
{
    return function()
    {
        image.loadingComplete = true;
    };
}

for( var i = 0; i < imageFileNames.length; i++ )
{
    var image = new Image();
    image.loadingComplete = false;
    image.onload = onLoadingComplete( image );
    image.onerror = onLoadingComplete( image );
    image.src = imageFileNames[ i ];
    images[ i ] = image;
}

function drawImage( context, imageNumber, x, y, width, height )
{
    if( images[ imageNumber ].loadingComplete )
    {
        context.drawImage( images[ imageNumber ], x, y, width, height );
        return true;
    }
    return false;
}

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

var waitForImagesLoadedInterval = null;
var waitForImagesLoadedDelay = 100;

function waitForImagesLoaded( callback )
{
    waitForImagesLoadedInterval = setInterval( function()
    {
        for( var i = 0; i < images.length; i++ )
        {
            if( !images[ i ].loadingComplete )
            {
                return;
            }
        }
        clearInterval( waitForImagesLoadedInterval );
        callback();
    }, waitForImagesLoadedDelay );
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
    board[ lightRow ][ lightColumn ] = cellUnlitLight;
}

function drawBoardCell( row, column )
{
    var x = boardStyle.left + ( boardCellWidth + boardBorderThickness ) * column;
    var y = boardStyle.top + ( boardCellHeight + boardBorderThickness )  * row;
    var cell = board[ row ][ column ];
    if( cell == cellEmpty )
    {
        context.fillStyle = emptyColor;
        context.fillRect( x, y, boardCellWidth, boardCellHeight );
    }
    else if( cell == cellUnlitLight )
    {
        context.fillStyle = unlitLightColor;
        context.fillRect( x, y, boardCellWidth, boardCellHeight );
    }
    else if( cell == cellLitLight )
    {
        context.fillStyle = litLightColor;
        context.fillRect( x, y, boardCellWidth, boardCellHeight );
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

function initializePlayer()
{
    playerFacing = facingDown;
    playerLocation = new Location( 0, 0 );
}

function drawPlayer()
{
    var x = boardStyle.left + playerLocation.column * ( boardCellWidth + boardBorderThickness );
    var y = boardStyle.top + playerLocation.row * ( boardCellHeight + boardBorderThickness );
    var width = boardCellWidth;
    var height = boardCellHeight;
    var imageIndex = -1;
    switch( playerFacing )
    {
        case facingDown:
            imageIndex = playerDownImage;
            break;
        case facingLeft:
            imageIndex = playerLeftImage;
            break;
        case facingRight:
            imageIndex = playerRightImage;
            break;
        case facingUp:
            imageIndex = playerUpImage;
            break;
    }
    if( imageIndex != -1 )
    {
        return drawImage( context, imageIndex, x, y, width, height );
    }
}


/* Moves */

var turnLeftMove = 0;
var turnRightMove = 1;
var forwardMove = 2;
var lightUpMove = 3;

var moves = [ ];
var possibleMoves = [ turnLeftMove, turnRightMove, forwardMove, lightUpMove ];

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

function executeMoves()
{
    stopExecution();
    initializePlayer();
    moveInterval = setInterval( function()
    {
        executeMove( moves[ currentMoveIndex ] );
        currentMoveIndex++;
        if( currentMoveIndex >= moves.length )
         {
             stopExecution();
         }
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
    var loc = getMoveButtonLocation( moveQueueParams, moves.length - 1 );
    addMoveButton( moveQueueParams, move, loc.x, loc.y );
}

function clearMoves()
{
    var moveButtons = document.getElementsByClassName( "moveButton" );
    while( moveButtons[ 0 ] )
    {
        moveButtons[ 0 ].parentNode.removeChild( moveButtons[ 0 ] );
    }
    moves = [ ];
}


/* Move Renderer */

var moveSize = 64;
var movePadding = 8;

function addMoveButton( params, move, x, y )
{
    var button = document.createElement( "input" );
    button.type = "image";
    button.className = params.moveButtonClass;
    button.disabled = params.moveButtonsDisabled;
    var left = x + params.x;
    var top = y + params.y;
    button.style.left = left + "px";
    button.style.top = top + "px";
    button.style.width = moveSize + "px";
    button.style.height = moveSize + "px";
    button.src = getImageSrcForMove( move );
    document.body.appendChild( button );
    return button;
}

function getMoveButtonLocation( params, moveIndex )
{
    var x = params.padding;
    var y = params.padding;
    for( var i = 0; i < moveIndex; i++ )
    {
        x += movePadding + moveSize;
        if( x + moveSize > params.width )
        {
            x = params.padding;
            y += movePadding + moveSize;
        }
    }
    return { x: x, y: y };
}


/* Move Queue */

function setMoveQueueSize( params )
{
    params.width = 2 * params.padding + params.movesPerRow * moveSize + ( params.movesPerRow - 1 ) * movePadding;
    params.height = 2 * params.padding + params.movesPerColumn * moveSize + ( params.movesPerColumn - 1 ) * movePadding;
}

var moveQueueParams = {
    x: boardStyle.right + 10,
    y: 10,
    moves: moves,
    padding: 10,
    backgroundColor: "#2EB8E6",
    borderColor: "#0D8FBA",
    movesPerRow: 5,
    movesPerColumn: 6,
    showCurrent: true,
    moveButtonClass: "moveButton",
    moveButtonsDisabled: true
};
setMoveQueueSize( moveQueueParams );

var possibleMoveQueueParams = {
    x: 10,
    y: boardStyle.bottom + 10,
    moves: possibleMoves,
    padding: 10,
    backgroundColor: "#2EB8E6",
    borderColor: "#0D8FBA",
    movesPerRow: 6,
    movesPerColumn: 1,
    showCurrent: false,
    moveButtonClass: "possibleMoveButton",
    moveButtonsDisabled: false
};
setMoveQueueSize( possibleMoveQueueParams );

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
        var loc = getMoveButtonLocation( possibleMoveQueueParams, i );
        var button = addMoveButton( possibleMoveQueueParams, possibleMoves[ i ], loc.x, loc.y );
        button.onclick = createOnPossibleMoveClick( possibleMoves[ i ] );
    }
}

function drawMoveQueue( params )
{
    context.fillStyle = params.backgroundColor;
    context.fillRect( params.x, params.y, params.width, params.height );
    context.strokeStyle = params.borderColor;
    context.strokeRect( params.x, params.y, params.width, params.height );
}


/* Buttons */

var buttonsPadding = 15;
var buttonSize = 81;

function onExecuteClick()
{
    executeMoves();
}

function createExecuteButton()
{
    var button = document.createElement( "input" );
    button.type = "image";
    button.className = "executeButton";
    var left = boardStyle.right + buttonsPadding;
    var top = boardStyle.bottom + buttonsPadding;
    button.style.left = left + "px";
    button.style.top = top + "px";
    button.style.width = buttonSize + "px";
    button.style.height = buttonSize + "px";
    button.src = "images/Execute.png";
    button.onclick = onExecuteClick;
    document.body.appendChild( button );
    return button;
}

function onStopClick()
{
    stopExecution();
}

function createStopButton()
{
    var button = document.createElement( "input" );
    button.type = "image";
    button.className = "stopButton";
    var left = boardStyle.right + buttonsPadding * 2 + buttonSize;
    var top = boardStyle.bottom + buttonsPadding;
    button.style.left = left + "px";
    button.style.top = top + "px";
    button.style.width = buttonSize + "px";
    button.style.height = buttonSize + "px";
    button.src = "images/Stop.png";
    button.onclick = onStopClick;
    document.body.appendChild( button );
    return button;
}

function onResetClick()
{
    stopExecution();
    initializePlayer();
    clearMoves();
}

function createResetButton()
{
    var button = document.createElement( "input" );
    button.type = "image";
    button.className = "resetButton";
    var left = boardStyle.right + buttonsPadding * 3 + buttonSize * 2;
    var top = boardStyle.bottom + buttonsPadding;
    button.style.left = left + "px";
    button.style.top = top + "px";
    button.style.width = buttonSize + "px";
    button.style.height = buttonSize + "px";
    button.src = "images/Reset.png";
    button.onclick = onResetClick;
    document.body.appendChild( button );
    return button;
}

function initializeControlButtons()
{
    createExecuteButton();
    createStopButton();
    createResetButton();
}

/* Rendering */

function clear()
{
    context.save();
    context.setTransform( 1, 0, 0, 1, 0, 0 );
    context.clearRect( 0, 0, context.canvas.width, context.canvas.height );
    context.restore();
}

function render()
{
    clear();
    drawBoard();
    drawPlayer();
    
    drawMoveQueue( moveQueueParams );
    drawMoveQueue( possibleMoveQueueParams );
}


/* Main */

function main()
{
    waitForImagesLoaded( _main );
}

function _main()
{
    initializeBoard();
    initializePlayer();
    initializePossibleMovesQueue();
    initializeControlButtons();
    resize();
    render();
}

main();