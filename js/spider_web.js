/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );
context.translate( 0.5, 0.5 );

var leftButton = document.getElementById( "left" );
var rightButton = document.getElementById( "right" );
var topButton = document.getElementById( "top" );
var bottomButton = document.getElementById( "bottom" );
var editCenterButton = document.getElementById( "editCenter" );
var clearLinesButton = document.getElementById( "clearLines" );

function onResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    render();
}

onDebouncedWindowResize( onResize );


/* Utilities */

function toCanvasPoint( normalizedPoint )
{
    var x = normalizedPoint.x * canvas.width;
    var y = normalizedPoint.y * canvas.height;
    return new Point( x, y );
}

function fromCanvasPoint( canvasPoint )
{
    var x = canvasPoint.x / canvas.width;
    var y = canvasPoint.y / canvas.height;
    return new Point( x, y );
}

function calculateSlope( p1, p2 )
{
    return ( p2.y - p1.y ) / ( p2.x - p1.x );
}

function findTouch( touchList, id )
{
    for( var i = 0; i < touchList.length; i++ )
    {
        if( touchList[ i ].identifier == id )
        {
            return touchList[ i ];
        }
    }
    return null;
}


/* Supporting Classes */

function Line( x, y, anchor )
{
    this.start = new Point( 0, 0 );
    this.end = new Point( 0, 0 );

    this.anchor = anchor;
    this.color = randomAbsoluteColor();

    this.move = function( x, y )
    {
        if( this.anchor == "left" )
        {
            this.start.x = 0;
            this.end.x = 1;
            this.start.y = this.end.y = y;
        }
        else if( this.anchor == "right" )
        {
            this.start.x = 1;
            this.end.x = 0;
            this.start.y = this.end.y = y;
        }
        else if( this.anchor == "top" )
        {
            this.start.y = 0;
            this.end.y = 1;
            this.start.x = this.end.x = x;
        }
        else if( this.anchor == "bottom" )
        {
            this.start.y = 1;
            this.end.y = 0;
            this.start.x = this.end.x = x;
        }
        else
        {
            throw "Invalid Anchor: " + anchor + "\nAnchor must be left, right, top, or bottom.";
        }
    };

    this.move( x, y );

    this.draw = function()
    {
        var start = toCanvasPoint( this.start, context );
        var end = toCanvasPoint( this.end, context );

        context.strokeStyle = this.color;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo( start.x, start.y );
        context.lineTo( end.x, end.y );
        context.stroke();
    };

    this.update = function( newCenter )
    {
        var m, b;
        if( this.anchor == "left" )
        {
            m = calculateSlope( this.start, newCenter );
            b = this.start.y - m * this.start.x;
            this.end.y = m * this.end.x + b;
        }
        else if( this.anchor == "right" )
        {
            m = calculateSlope( this.start, newCenter );
            b = this.start.y - m * this.start.x;
            this.end.y = m * this.end.x + b;
        }
        else if( this.anchor == "top" )
        {
            m = calculateSlope( this.start, newCenter );
            b = this.start.y - m * this.start.x;
            this.end.x = ( 1 - b ) / m;
        }
        else if( this.anchor == "bottom" )
        {
            m = calculateSlope( this.start, newCenter );
            b = this.start.y - m * this.start.x;
            this.end.x = ( 0 - b ) / m;
        }
    };
}


/* Spider Web Creation */

var currentAnchor = editCenterButton.id;
var touchId;

function editButtonClick( button )
{
    return function()
    {
        currentAnchor = button.id;
        var primaryButtons = document.getElementsByClassName( "btn-primary" );
        while( primaryButtons.length != 0 )
        {
            primaryButtons[ 0 ].classList.remove( "btn-primary" );
        }
        button.classList.add( "btn-primary" );
    };
}

leftButton.addEventListener( "click", editButtonClick( leftButton ) );
rightButton.addEventListener( "click", editButtonClick( rightButton ) );
topButton.addEventListener( "click", editButtonClick( topButton ) );
bottomButton.addEventListener( "click", editButtonClick( bottomButton ) );
editCenterButton.addEventListener( "click", editButtonClick( editCenterButton ) );
clearLinesButton.addEventListener( "click", function()
{
    lines = [ ];
} );

canvas.addEventListener( "pointerdown", function ( e )
{
    e.preventDefault();
    setRelativeCoordinates( e );
    downInput( e._x, e._y );
} );

canvas.addEventListener( "pointermove", function( e )
{
    e.preventDefault();
    setRelativeCoordinates( e );
    moveInput( e._x, e._y );
} );

canvas.addEventListener( "pointerup", function ( e )
{
    e.preventDefault();
    upInput();
} );

canvas.addEventListener( "pointerleave", function ( e )
{
    e.preventDefault();
    cancelInput();
} );

var inputDown = false;

var newLine = null;

function addingLines()
{
    return currentAnchor != editCenterButton.id;
}

function downInput( x, y )
{
    x /= canvas.width;
    y /= canvas.height;

    inputDown = true;
    if( addingLines() )
    {
        newLine = new Line( x, y, currentAnchor );
    }
    else
    {
        updateCenter( x, y );
    }
}

function moveInput( x, y )
{
    if( inputDown )
    {
        x /= canvas.width;
        y /= canvas.height;

        if( addingLines() )
        {
            newLine.move( x, y );
        }
        else
        {
            updateCenter( x, y );
        }
    }
}

function upInput()
{
    if( inputDown )
    {
        inputDown = false;

        if( addingLines() && newLine != null )
        {
            lines.push( newLine );
            newLine = null;
        }
    }
}

function cancelInput()
{
    if( inputDown )
    {
        inputDown = false;

        if( addingLines() )
        {
            newLine = null;
        }
        else
        {
            center = null;
        }
    }
}

function updateCenter( x, y )
{
    center = new Point( x, y );
    lines.forEach( function( line )
    {
        line.update( center );
    } );
}


/* Spider Web */

var center = null;
var lines = [ ];


/* Rendering */

function render()
{
    clear( context );

    lines.forEach( function( line )
    {
        line.draw();
    } );

    if( newLine != null )
    {
        newLine.draw();
    }

    if( center != null )
    {
        var canvasCenter = toCanvasPoint( center );
        fillCircle( context, canvasCenter.x, canvasCenter.y, 5, "black" );
    }
}


/* Animation */

function update( elapsedTime )
{

}


/* Main */

function main()
{
    onResize();
    render();
    startAnimation( update, render );
}

main();
