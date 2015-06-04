/* Document Elements */

var playButton = document.getElementById( "play" );
playButton.style.display = "none";
var pauseButton = document.getElementById( "pause" );

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );
context.translate( 0.5, 0.5 );

var mainContent = document.getElementById( "mainContent" );

function onWindowResize()
{
    canvas.width = mainContent.clientWidth;
    canvas.height = mainContent.clientHeight;
}

var resizeTimer;
window.addEventListener( "resize", function()
{
    clearTimeout( resizeTimer );
    resizeTimer = setTimeout( onWindowResize, 250 );
} );
onWindowResize();


/* Utilities */

function random( x, y )
{
    if( y === undefined )
    {
        return Math.random() * x;
    }
    else
    {
        return random( y - x ) + x;
    }
}

function randomColor()
{
    var r = Math.floor( random( 256 ) );
    var g = Math.floor( random( 256 ) );
    var b = Math.floor( random( 256 ) );
    return "rgb(" + r + "," + g + "," + b + ")";
}

function fillCircle( c, centerX, centerY, radius, fillStyle )
{
    context.beginPath();
    context.arc( centerX, centerY, radius, 0, 2 * Math.PI, false );
    context.fillStyle = fillStyle;
    context.fill();
}

function drawLines( c, points, strokeStyle )
{
    if( points.length > 1 )
    {
        c.strokeStyle = strokeStyle;
        c.beginPath();
        var p = points[ 0 ];
        c.moveTo( p.x, p.y );
        for( var i = 1; i < points.length; i++ )
        {
            var point = points[ i ];
            c.lineTo( point.x, point.y );
        }
        c.stroke();
    }
}

function drawRay( c, startX, startY, vector, color )
{
    c.strokeStyle = color;
    c.beginPath();
    c.moveTo( startX, startY );
    c.lineTo( vector.x, vector.y );
    c.stroke();
}

function distance( p1, p2 )
{
    var xDiff = p1.x - p2.x;
    var yDiff = p1.y - p2.y;
    return Math.sqrt( xDiff * xDiff + yDiff * yDiff );
}

function distanceNonZero( p1, p2 )
{
    var dist = distance( p1, p2 );
    return dist != 0 ? dist : distanceEpsilon;
}


/* Physics Stuff */

var distanceEpsilon = 0.000000001;

function Vector( x, y )
{
    this.x = x;
    this.y = y;
    
    this.copy = function()
    {
        return new Vector( this.x, this.y );
    };
    this.toString = function()
    {
        return this.x + ", " + this.y;
    };
    this.getLength = function()
    {
        var length = Math.sqrt( this.x * this.x + this.y * this.y );
        return length != 0 ? length : distanceEpsilon;
    };
    this.getUnitVector = function()
    {
        return this.scalarDivide( this.getLength() );
    };
    this.scalarMultiply = function( scalar )
    {
        return new Vector( scalar * this.x, scalar * this.y );
    };
    this.scalarDivide = function( scalar )
    {
        if( scalar == 0 )
        {
            throw "Cannot divide by 0.";
        }
        return new Vector( this.x / scalar, this.y / scalar );
    };
    this.add = function( v )
    {
        return new Vector( this.x + v.x, this.y + v.y );
    };
    this.subtract = function( v )
    {
        return new Vector( this.x - v.x, this.y - v.y );
    };
}

var G = 6.673 * Math.pow( 10, -11 ); // N(m/kg)^2)

function calculateGravitationForce( b1, b2 )
{
    var b1V = b1.position;
    var b2V = b2.position;
    
    var dist = distanceNonZero( b1V, b2V );
    var radius = b1.radius + b2.radius;
    if( dist < radius )
    {
        dist = radius;
    }
    var scalar = -G * ( b1.getMass() * b2.getMass() ) / ( dist * dist );
    var distanceVector = b1V.subtract( b2V );
    var unitVector = distanceVector.getUnitVector();
    var vector = unitVector.scalarMultiply( scalar );
    return vector;
}

function calculateTotalGravitationalForce( b1 )
{
    var total = new Vector( 0, 0 );
    for( var i = 0; i < bodies.length; i++ )
    {
        if( b1 != bodies[ i ] )
        {
            var v = calculateGravitationForce( b1, bodies[ i ] );
            total = total.add( v );
        }
    }
    return total;
}


/* Bodies */

var bodies = [ ];

var minPathDistance = 5;
var maxPathPoints = 1000;
var maxSpeed = 50;
var spawnPaddingPercent = 0.2;

function Body( x, y )
{
    if( x === undefined )
    {
        var widthPadding = canvas.width * spawnPaddingPercent;
        x = random( widthPadding, canvas.width - widthPadding );
    }
    if( y === undefined )
    {
        var heightPadding = canvas.height * spawnPaddingPercent;
        y = random( heightPadding, canvas.height - heightPadding );
    }
    
    this.position = new Vector( x, y );
    this.radius = random( 30, 50 );
    this.speed = new Vector( random( -maxSpeed, maxSpeed ), random( -maxSpeed, maxSpeed ) );
    this.fixed = false;
    this.color = randomColor();
    this.pathColor = randomColor();
    this.path = [ this.position.copy() ];
    this.lastGForce = new Vector( 0, 0 );

    this.getMass = function()
    {
        return this.radius * 10000000000000000;
    };
    this.calculateTotalGForce = function()
    {
        this.lastGForce = calculateTotalGravitationalForce( this );
    };
    this.applyTotalGForce = function( elapsedTime )
    {
        if( this.fixed )
        {
            return;
        }
        var acceleration = this.lastGForce.scalarDivide( this.getMass() );
        var deltaVelocity = acceleration.scalarMultiply( elapsedTime );
        this.speed = this.speed.add( deltaVelocity );
        var deltaPosition = this.speed.scalarMultiply( elapsedTime );
        this.position = this.position.add( deltaPosition );
        
        this.updatePath();
    };
    this.updatePath = function()
    {
        var lastPosition = this.path[ this.path.length - 1 ];
        if( distanceNonZero( lastPosition, this.position ) > minPathDistance )
        {
            this.path.push( this.position.copy() );
        }
        if( this.path.length > maxPathPoints )
        {
            this.path.shift();
        }
    };
    this.paint = function( c )
    {
        drawLines( c, this.path, this.pathColor );
        fillCircle( c, this.position.x, this.position.y, this.radius, this.color );
    };
}

function updateBodies( elapsedTime )
{
    for( var i = 0; i < bodies.length; i++ )
    {
        bodies[ i ].calculateTotalGForce();
    }
    for( var i = 0; i < bodies.length; i++ )
    {
        bodies[ i ].applyTotalGForce( elapsedTime );
    }
}

function paintBodies( c )
{
    for( var i = bodies.length - 1; i >= 0; i-- )
    {
        bodies[ i ].paint( c );
    }
}


/* Animation */

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

var paused = false;

var lastTime = 0;
function animate( time )
{
    var elapsedTime = time - lastTime;
    lastTime = time;

    render();
    if( !paused && elapsedTime < 100 )
    {
        updateBodies( elapsedTime / 1000 );
    }
    window.requestAnimationFrame( animate );
}


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
    paintBodies( context );
    if( heldBody != null && heldRay != null )
    {
        drawRay( context, heldRay.x, heldRay.y, heldBody.position, "green" );
        heldBody.paint();
    }
}


/* Input Handler */

var inputMoveThreshold = 20;

var heldBody = null;
var heldRay = null;

function onInputDown( x, y )
{
    if( heldBody == null )
    {
        heldBody = new Body( x, y );
        heldRay = new Vector( x, y );
    }
}

function onInputMoved( x, y )
{
    if( heldBody != null )
    {
        heldBody.position.x = x;
        heldBody.position.y = y;
    }
}

function onInputUp( x, y )
{
    if( heldBody == null )
    {
        return;
    }
    var dist = distance( heldBody.position, heldRay );
    if( dist < inputMoveThreshold )
    {
        heldBody.fixed = true;
        bodies.push( heldBody );
    }
    else
    {
        var xDiff = heldRay.x - heldBody.position.x;
        var yDiff = heldRay.y - heldBody.position.y;
        heldBody.speed.x = xDiff;
        heldBody.speed.y = yDiff;
        bodies.unshift( heldBody );
    }
    heldBody.path = [ heldBody.position.copy() ];
    heldBody = null;
    heldRay = null;
}

canvas.addEventListener( "mousedown", function( e )
{
    var x = e.x - canvas.offsetLeft;
    var y = e.y - canvas.offsetTop;
    onInputDown( x, y );
} );

canvas.addEventListener( "mousemove", function( e )
{
    var x = e.x - canvas.offsetLeft;
    var y = e.y - canvas.offsetTop;
    onInputMoved( x, y );
} );

canvas.addEventListener( "mouseout", function( e )
{
    var x = e.x - canvas.offsetLeft;
    var y = e.y - canvas.offsetTop;
    onInputUp( x, y );
} );

canvas.addEventListener( "mouseup", function( e )
{
    var x = e.x - canvas.offsetLeft;
    var y = e.y - canvas.offsetTop;
    onInputUp( x, y );
} );

function swapDisplay( e1, e2 )
{
    var display = e1.style.display;
    e1.style.display = e2.style.display;
    e2.style.display = display;
}

playButton.onclick = function()
{
    swapDisplay( playButton, pauseButton );
    paused = false;
};

pauseButton.onclick = function()
{
    swapDisplay( playButton, pauseButton );
    paused = true;
};


/* Main */

function main()
{
    for( var i = 0; i < 0; i++ )
    {
        bodies.push( new Body() );
    }

    animate( 0 );
}

main();