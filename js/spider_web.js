/* Document Elements */

var mainContent = document.getElementById( "mainContent" );

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
    canvas.width = mainContent.clientWidth;
    canvas.height = mainContent.clientHeight;

    render();
}

var resizeTimer;
window.addEventListener( "resize", function()
{
    clearTimeout( resizeTimer );
    resizeTimer = setTimeout( onResize, 250 );
} );


/* Utilities */

function random( num1, num2 )
{
    if( num2 === undefined )
    {
        return Math.random() * num1;
    }
    else
    {
        return random( num2 - num1 ) + num1;
    }
}

function randomColor()
{
    var r = Math.floor( random( 256 ) );
    var g = Math.floor( random( 256 ) );
    var b = Math.floor( random( 256 ) );
    return "rgb(" + r + "," + g + "," + b + ")";
}

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

function fillCircle( center, radius, color )
{
    context.fillStyle = color;
    context.beginPath();
    context.arc( center.x, center.y, radius, 0, 2 * Math.PI );
    context.fill();
}

function distance( p1, p2 )
{
    var xDiff = p1.x - p2.x;
    var yDiff = p1.y - p2.y;
    return Math.sqrt( xDiff * xDiff + yDiff * yDiff );
}

function drawPath( points, end, lineWidth, lineColor )
{
    if( points.length > 0 )
    {
        context.lineWidth = lineWidth;
        context.strokeStyle = lineColor;
        context.beginPath();
        var first = toCanvasPoint( points[ 0 ] );
        context.moveTo( first.x, first.y );
        for( var i = 1; i < points.length; i++ )
        {
            var p = toCanvasPoint( points[ i ] );
            context.lineTo( p.x, p.y );
        }
        context.lineTo( end.x, end.y );
        context.stroke();
    }
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

function Point( x, y )
{
    this.x = x;
    this.y = y;
}

function Line( x, y, anchor )
{
    this.start = new Point( 0, 0 );
    this.end = new Point( 0, 0 );
    
    this.anchor = anchor;
    this.color = randomColor();
    
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

if( !window.touch_screen )
{
    canvas.addEventListener( "mousedown", function ( e )
    {
        downInput( e.x, e.y );
    } );
    
    canvas.addEventListener( "mousemove", function( e )
    {
        moveInput( e.x, e.y );
    } );
    
    canvas.addEventListener( "mouseup", function ( e )
    {
        upInput();
    } );
    
    canvas.addEventListener( "mouseleave", function ( e )
    {
        cancelInput();
    } );
}
else
{
    canvas.addEventListener( "touchstart", function ( e )
    {
        e.preventDefault();
        
        var touch = e.changedTouches[ 0 ];
        touchId = touch.identifier;
        downInput( touch.clientX, touch.clientY );
    } );
    
    canvas.addEventListener( "touchmove", function( e )
    {
        e.preventDefault();
        
        var touch = findTouch( e.changedTouches, touchId );
        if( touch != null )
        {
            moveInput( touch.clientX, touch.clientY );
        }
    } );
    
    canvas.addEventListener( "touchend", function ( e )
    {
        e.preventDefault();
        
        var touch = findTouch( e.changedTouches, touchId );
        if( touch != null )
        {
            upInput();
        }
    } );
    
    canvas.addEventListener( "touchcancel", function ( e )
    {
        e.preventDefault();
        
        var touch = findTouch( e.changedTouches, touchId );
        if( touch != null )
        {
            cancelInput();
        }
    } );
}

var inputDown = false;

var newLine = null;

function addingLines()
{
    return currentAnchor != editCenterButton.id;
}

function downInput( x, y )
{
    x = ( x - canvas.offsetLeft ) / canvas.width;
    y = ( y - canvas.offsetTop ) / canvas.height;

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
        x = ( x - canvas.offsetLeft ) / canvas.width;
        y = ( y - canvas.offsetTop ) / canvas.height;
        
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

function clear()
{
    context.save();

    context.setTransform( 1, 0, 0, 1, 0, 0 );
    context.clearRect( 0, 0, canvas.width, canvas.height );

    context.restore();
}

function render()
{
    clear();
    
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
        fillCircle( toCanvasPoint( center ), 5, "black" );
    }
}


/* Animation */

function update( elapsedTime )
{

}

( function()
{
    var lastTime = 0;
    var vendors = [ 'webkit', 'moz' ];
    for( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x )
    {
        window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
        window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ]
                                   || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
    }
    if( !window.requestAnimationFrame )
    {
        window.requestAnimationFrame = function( callback, element )
        {
            var currTime = new Date().getTime();
            var timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
            var id = window.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if( !window.cancelAnimationFrame )
        window.cancelAnimationFrame = function( id )
        {
            clearTimeout( id );
        };
}() );

var lastTime = 0;
function animate( time )
{
    var elapsedTime = time - lastTime;
    lastTime = time;

    update( elapsedTime / 1000 );
    render();
    window.requestAnimationFrame( animate );
}


/* Main */

function main()
{
    onResize();
    render();
    animate( 0 );
}

main();
