/* Document Elements */

var boardCanvas = document.getElementById( "board" );
var boardContext = boardCanvas.getContext( "2d" );
boardContext.translate( 0.5, 0.5 );

var moveQueueCanvas = document.getElementById( "moveQueue" );
var moveQueueContext = moveQueueCanvas.getContext( "2d" );
moveQueueContext.translate( 0.5, 0.5 );

var possibleMovesCanvas = document.getElementById( "possibleMoves" );
var possibleMovesContext = possibleMovesCanvas.getContext( "2d" );
possibleMovesContext.translate( 0.5, 0.5 );

var buttonsCanvas = document.getElementById( "buttons" );
var buttonsContext = buttonsCanvas.getContext( "2d" );
buttonsContext.translate( 0.5, 0.5 );

function resize()
{
    var leftWidth = boardWidth;
    var rightWidth = window.innerWidth - boardWidth;
    var topHeight = boardHeight;
    var bottomHeight = window.innerHeight - boardHeight;
    
    boardCanvas.width = leftWidth;
    boardCanvas.height = topHeight;
    
    moveQueueCanvas.width = rightWidth;
    moveQueueCanvas.height = topHeight;
    
    possibleMovesCanvas.width = leftWidth;
    possibleMovesCanvas.height = bottomHeight;
    
    buttonsCanvas.width = rightWidth;
    buttonsCanvas.height = bottomHeight;

    render();
}

var resizeTimer;
addEventListener( "resize", function()
{
    clearTimeout( resizeTimer );
    resizeTimer = setTimeout( resize, 250 );
} );


/* Images */

var turnLeftImage = 0;
var turnRightImage = 1;
var forwardImage = 2;
var lightUpImage = 3;
var playerDownImage = 4;
var playerUpImage = 5;
var playerLeftImage = 6;
var playerRightImage = 7;

var imageFileNames = [
    "images/TurnLeft.png",
    "images/TurnRight.png",
    "images/MoveForward.png",
    "images/LightUp.png",
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

var board = [];

var boardWidth = 500;
var boardHeight = 500;

var boardRows = 10;
var boardColumns = 10;

var cellEmpty = 0;
var cellUnlitLight = 1;
var cellLitLight = 2;

var emptyColor = "#669999";
var unlitLightColor = "#FFFF99";
var litLightColor = "#FFFF00";

var boardStartX = 0;
var boardStartY = 0;
var boardBorderThickness = 1;
var boardCellWidth = ( boardWidth - boardBorderThickness * ( boardColumns - 1 ) ) / boardColumns;
var boardCellHeight = ( boardHeight - boardBorderThickness * ( boardRows - 1 ) ) / boardRows;

function initializeBoard()
{
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
    var cell = board[ row ][ column ];
    var validCell = true;
    if( cell == cellEmpty )
    {
        validCell = true;
        boardContext.fillStyle = emptyColor;
    }
    else if( cell == cellUnlitLight )
    {
        validCell = true;
        boardContext.fillStyle = unlitLightColor;
    }
    else if( cell == cellLitLight )
    {
        validCell = true;
        boardContext.fillColor = litLightColor;
    }
    
    if( validCell )
    {
        var x = boardStartX + ( boardCellWidth + boardBorderThickness ) * column;
        var y = boardStartY + ( boardCellHeight + boardBorderThickness )  * row;
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

var playerFacing = facingDown;
var playerLocation = new Location( 0, 0 );

function drawPlayer()
{
    var x = boardStartX + playerLocation.column * ( boardCellWidth + boardBorderThickness );
    var y = boardStartY + playerLocation.row * ( boardCellHeight + boardBorderThickness );
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
        return drawImage( boardContext, imageIndex, x, y, width, height );
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
    currentMoveIndex = 0;
    moveInterval = setInterval( function()
    {
        executeMove( moves[ currentMoveIndex ] );
        currentMoveIndex++;
        if( currentMoveIndex >= moves.length )
         {
             clearInterval( moveInterval );
             moveInterval = null;
         }
         render();
    }, moveExecutionDelay );
}

function addMove( move )
{
    moves.push( move );
    var loc = getMoveButtonLocation( moveQueueParams, moves.length - 1 );
    var button = createMoveButton( moveQueueParams, move, loc.x, loc.y );
    document.body.appendChild( button );
}


/* Move Renderer */

var moveSize = 64;
var movePadding = 8;

var moveBorderColor = "#009671";
var moveBackgroundColor = "#00CC99";

var currentMoveBorderColor = "#009671";
var currentMoveBackgroundColor = "#00FFBF";

function createMoveButton( params, move, x, y )
{
    var button = document.createElement( "input" );
    button.type = "button";
    button.className = params.moveButtonClass;
    var rect = params.canvas.getBoundingClientRect();
    var left = x + rect.left;
    var top = y + rect.top;
    console.log( "left: " + rect.left + " top: " + rect.top );
    button.style.left = left + "px";
    button.style.top = top + "px";
    button.style.width = moveSize + "px";
    button.style.height = moveSize + "px";
    return button;
}

function getMoveButtonId( moveIndex )
{
    return "moveQueueButton" + moveIndex;
}

function getMoveButtonLocation( params, moveIndex )
{
    var x = params.padding * 2;
    var y = params.padding * 2;
    for( var i = 0; i < moveIndex; i++ )
    {
        drawMove( params.context, moves[ i ], x, y, params.showCurrent && ( i == currentMoveIndex ) );
        x += movePadding + moveSize;
        if( x + moveSize > params.width )
        {
            x = params.padding * 2;
            y += movePadding + moveSize;
        }
    }
    return { x: x, y: y };
}

function drawMove( context, move, x, y, current )
{
    context.fillStyle = current ? currentMoveBackgroundColor : moveBackgroundColor;
    context.fillRect( x, y, moveSize, moveSize );
    context.strokeStyle = current ? currentMoveBorderColor : moveBorderColor;
    context.strokeRect( x, y, moveSize, moveSize );
    x += movePadding;
    y += movePadding;
    var size = moveSize - movePadding * 2;
    var imageIndex = -1;
    switch( move )
    {
        case forwardMove:
            imageIndex = forwardImage;
            break;
        case turnLeftMove:
            imageIndex = turnLeftImage;
            break;
        case turnRightMove:
            imageIndex = turnRightImage;
            break;
        case lightUpMove:
            imageIndex = lightUpImage;
            break;
    }
    if( imageIndex != -1 )
    {
        return drawImage( context, imageIndex, x, y, size, size );
    }
}


/* Move Queue */

function setMoveQueueSize( params )
{
    params.width = 2 * params.padding + params.movesPerRow * moveSize + ( params.movesPerRow - 1 ) * movePadding;
    params.height = 2 * params.padding + params.movesPerColumn * moveSize + ( params.movesPerColumn - 1 ) * movePadding;
}

var moveQueueParams = {
    canvas: moveQueueCanvas,
    context: moveQueueContext,
    moves: moves,
    padding: 10,
    backgroundColor: "#2EB8E6",
    borderColor: "#0D8FBA",
    movesPerRow: 5,
    movesPerColumn: 6,
    showCurrent: true,
    moveButtonClass: "moveButton"
};
setMoveQueueSize( moveQueueParams );

var possibleMoveQueueParams = {
    canvas: possibleMovesCanvas,
    context: possibleMovesContext,
    moves: possibleMoves,
    padding: 10,
    backgroundColor: "#2EB8E6",
    borderColor: "#0D8FBA",
    movesPerRow: 6,
    movesPerColumn: 1,
    showCurrent: false,
    moveButtonClass: "possibleMoveButton"
};
setMoveQueueSize( possibleMoveQueueParams );

function drawMoveQueue( params )
{
    params.context.fillStyle = params.backgroundColor;
    params.context.fillRect( params.padding, params.padding, params.width, params.height );
    params.context.strokeStyle = params.borderColor;
    params.context.strokeRect( params.padding, params.padding, params.width, params.height );
    
    var x = params.padding * 2;
    var y = params.padding * 2;
    for( var i = 0; i < params.moves.length; i++ )
    {
        drawMove( params.context, moves[ i ], x, y, params.showCurrent && ( i == currentMoveIndex ) );
        x += movePadding + moveSize;
        if( x + moveSize > params.width )
        {
            x = params.padding * 2;
            y += movePadding + moveSize;
            if( y + moveSize > params.height )
            {
                break;
            }
        }
    }
}


/* Rendering */

function clear()
{
    boardContext.save();
    boardContext.setTransform( 1, 0, 0, 1, 0, 0 );
    boardContext.clearRect( 0, 0, boardContext.canvas.width, boardContext.canvas.height );
    boardContext.restore();
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
    resize();
    render();
}

addMove( turnLeftMove );
addMove( turnRightMove );
addMove( forwardMove );
addMove( lightUpMove );
addMove( turnLeftMove );
addMove( turnRightMove );
addMove( forwardMove );
addMove( lightUpMove );
addMove( turnLeftMove );
addMove( turnRightMove );
addMove( forwardMove );
addMove( lightUpMove );
addMove( turnLeftMove );
addMove( turnRightMove );
addMove( forwardMove );
addMove( lightUpMove );
addMove( turnLeftMove );
addMove( turnRightMove );
addMove( forwardMove );
addMove( lightUpMove );
addMove( turnLeftMove );
addMove( turnRightMove );
addMove( forwardMove );
addMove( lightUpMove );
addMove( turnLeftMove );
addMove( turnRightMove );
addMove( forwardMove );
addMove( lightUpMove );
addMove( turnLeftMove );
addMove( turnRightMove );

main();

executeMoves();