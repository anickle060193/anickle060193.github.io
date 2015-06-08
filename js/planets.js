/* Document Elements */

var playButton = document.getElementById( "play" );
playButton.classList.add( "inactive" );
var pauseButton = document.getElementById( "pause" );

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );
context.translate( 0.5, 0.5 );

// http://ironsummitmedia.github.io/startbootstrap-simple-sidebar/
var menuToggleButton = document.getElementById( "menu-toggle" );
var wrapper = document.getElementById( "wrapper" );

menuToggleButton.addEventListener( "click", function( e )
{
    e.preventDefault();
    wrapper.classList.toggle( "toggled" );
} );

var mainContent = document.getElementById( "mainContent" );

function onWindowResize()
{
    canvas.width = mainContent.clientWidth;
    canvas.height = mainContent.clientHeight;
}

onDebouncedWindowResize( onWindowResize );


/* Utilities */

function drawRay( c, startX, startY, vector, color )
{
    c.strokeStyle = color;
    c.beginPath();
    c.moveTo( startX, startY );
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
var paused = false;

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
    this.color = randomDistributedColor();
    this.pathColor = randomDistributedColor();
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
    this.paint = function()
    {
        drawLines( context, this.path, this.pathColor );
        fillCircle( context, this.position.x, this.position.y, this.radius, this.color );
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
    var loc = getRelativeCoordinates( e );
    var x = loc.x;
    var y = loc.y;
    onInputDown( x, y );
} );

canvas.addEventListener( "mousemove", function( e )
{
    var loc = getRelativeCoordinates( e );
    var x = loc.x;
    var y = loc.y;
    onInputMoved( x, y );
} );

canvas.addEventListener( "mouseout", function( e )
{
    var loc = getRelativeCoordinates( e );
    var x = loc.x;
    var y = loc.y;
    onInputUp( x, y );
} );

canvas.addEventListener( "mouseup", function( e )
{
    var loc = getRelativeCoordinates( e );
    var x = loc.x;
    var y = loc.y;
    onInputUp( x, y );
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
