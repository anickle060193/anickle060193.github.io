/* Includes */

/// <reference path="utilities.js" />


/* Document Elements */

var playButton = document.getElementById( "play" );
playButton.classList.add( "inactive" );
var pauseButton = document.getElementById( "pause" );

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );
context.translate( 0.5, 0.5 );

function onWindowResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

onDebouncedWindowResize( onWindowResize );


/* Utilities */

function randomPoN( min, max )
{
    return random( min, max ) * ( Math.random() < 0.5 ? -1 : 1 );
}

function drawRay( c, start, vector, color )
{
    c.strokeStyle = color;
    c.beginPath();
    c.moveTo( start.x, start.y );
    c.lineTo( vector.x, vector.y );
    c.stroke();
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
    this.toPixels = function()
    {
        return this.scalarMultiply( meterToPixel );
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
    var scalar = -G * ( b1.mass * b2.mass ) / ( dist * dist );
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
var paused = false;

var minPathDistance = 5;
var maxPathPoints = 1000;

var minSpeed = 19720000; // m/s, Speed of Mercutu around the Sun
var maxSpeed = 47051000; // m/s, Speed of Jupiter around the Sun

var minMass = 3.3022 * Math.pow( 10, 23 ); // kg, Mercury maxx
var maxMass = 1.0243 * Math.pow( 10, 26 ); // kg, Neptune maxx

var minRadius = 2439700; // meters, Mercury radius
var maxRadius = 24622000; // meters, Neptune radius

var realEarthRadius = 6371000; // meters
var virtualEarthRadius = 20; // pixels

var pixelToMeter = realEarthRadius / virtualEarthRadius;
var meterToPixel = 1 / pixelToMeter;

function Body( x, y )
{
    this.position = new Vector( x, y );
    this.radius = random( minRadius, maxRadius );
    this.mass = random( minMass, maxMass );
    this.speed = new Vector( randomPoN( minSpeed, maxSpeed ), randomPoN( minSpeed, maxSpeed ) );
    this.fixed = false;
    this.color = randomDistributedColor();
    this.pathColor = randomDistributedColor();
    this.path = [ ];
    this.lastGForce = new Vector( 0, 0 );

    this.calculateTotalGForce = function()
    {
        if( this.fixed )
        {
            return;
        }
        this.lastGForce = calculateTotalGravitationalForce( this );
    };
    this.applyTotalGForce = function( elapsedTime )
    {
        if( this.fixed )
        {
            return;
        }
        var acceleration = this.lastGForce.scalarDivide( this.mass );
        var deltaVelocity = acceleration.scalarMultiply( elapsedTime );
        this.speed = this.speed.add( deltaVelocity );
        var deltaPosition = this.speed.scalarMultiply( elapsedTime );
        this.position = this.position.add( deltaPosition );
        this.updatePath();
    };
    this.updatePath = function()
    {
        if( this.path.length == 0 )
        {
            this.path.push( this.position.toPixels() );
        }
        else
        {
            var lastPosition = this.path[ this.path.length - 1 ].toPixels();
            var currentPosition = this.position.toPixels();
            var dist = distanceNonZero( lastPosition, currentPosition );
            if( dist > minPathDistance )
            {
                this.path.push( currentPosition );
            }
        }
        if( this.path.length > maxPathPoints )
        {
            this.path.shift();
        }
    };
    this.paint = function()
    {
        drawLines( context, this.path, this.pathColor );
        var pixelLoc = this.position.toPixels();
        var pixelRadius = this.radius * meterToPixel;
        fillCircle( context, pixelLoc.x, pixelLoc.y, pixelRadius, this.color );
    };
}

function updateBodies( elapsedTime )
{
    if( !paused )
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
}


/* Rendering */

function render()
{
    clear( context );
    for( var i = bodies.length - 1; i >= 0; i-- )
    {
        bodies[ i ].paint();
    }
    if( heldBody != null && heldRay != null )
    {
        drawRay( context, heldRay.toPixels(), heldBody.position.toPixels(), "green" );
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
        x *= pixelToMeter;
        y *= pixelToMeter;
        heldBody = new Body( x, y );
        heldRay = new Vector( x, y );
    }
}

function onInputMoved( x, y )
{
    if( heldBody != null )
    {
        heldBody.position.x = x * pixelToMeter;
        heldBody.position.y = y * pixelToMeter;
    }
}

function onInputUp( x, y )
{
    if( heldBody == null )
    {
        return;
    }
    var rayPixelLoc = heldRay.toPixels();
    var bodyPixelLoc = heldBody.position.toPixels();
    var dist = distance( bodyPixelLoc, rayPixelLoc );
    if( dist < inputMoveThreshold )
    {
        heldBody.fixed = true;
        heldBody.speed = new Vector( 0, 0 );
        bodies.push( heldBody );
    }
    else
    {
        var xDiff = rayPixelLoc.x - bodyPixelLoc.x;
        var yDiff = rayPixelLoc.y - bodyPixelLoc.y;
        heldBody.speed.x = maxSpeed / canvas.width * xDiff * 10;
        heldBody.speed.y = maxSpeed / canvas.height * yDiff * 10;
        bodies.unshift( heldBody );
        heldBody.updatePath();
    }
    heldBody = null;
    heldRay = null;
}

canvas.addEventListener( "pointerdown", function( e )
{
    e.preventDefault();
    setRelativeCoordinates( e );
    onInputDown( e._x, e._y );
} );

canvas.addEventListener( "pointermove", function( e )
{
    e.preventDefault();
    setRelativeCoordinates( e );
    onInputMoved( e._x, e._y );
} );

canvas.addEventListener( "pointerout", function( e )
{
    e.preventDefault();
    setRelativeCoordinates( e );
    onInputUp( e._x, e._y );
} );

canvas.addEventListener( "pointerup", function( e )
{
    e.preventDefault();
    setRelativeCoordinates( e );
    onInputUp( e._x, e._y );
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


/* Main */

function main()
{
    onWindowResize();
    startAnimation( updateBodies, render );
}

main();
