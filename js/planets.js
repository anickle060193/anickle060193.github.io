/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var playButton = document.getElementById( "play" );
playButton.classList.add( "inactive" );
var pauseButton = document.getElementById( "pause" );

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var presetButton = document.getElementById( "newPlanetPresetButton" );
var presetDropdown = document.getElementById( "presetsList" );
var radiusGroup = document.getElementById( "radiusGroup" );
var newPlanetRadius = document.getElementById( "newPlanetRadius" );
var massGroup = document.getElementById( "massGroup" );
var newPlanetMass = document.getElementById( "newPlanetMass" );
var colorGroup = document.getElementById( "colorGroup" );
var newPlanetColor = document.getElementById( "newPlanetColor" );

var createPlanetButton = document.getElementById( "createPlanet" );
var zoomOutButton = document.getElementById( "zoomOut" );
var zoomInButton = document.getElementById( "zoomIn" );
var moveButton = document.getElementById( "move" );
var doneButton = document.getElementById( "done" );

var timeFactor = 1000;

var timeFactorInput = document.getElementById( "timeFactor" );
timeFactorInput.value = timeFactor;
var updateTimeFactor = document.getElementById( "updateTimeFactor" );
var timeFactorGroup = document.getElementById( "timeFactorGroup" );

updateTimeFactor.addEventListener( "click", function()
{
    if( validateTimeFactor() )
    {
        timeFactor = getTimeFactor();
    }
} );

function onWindowResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

onDebouncedWindowResize( onWindowResize );

$( '[ data-toggle="popover" ]' ).popover();

function setupValidator( input, group, validatorFunc )
{
    input.addEventListener( "input", function()
    {
        setPresetButtonText( "Custom" );
        if( !validatorFunc() )
        {
            group.classList.add( "has-error" );
        }
        else
        {
            group.classList.remove( "has-error" );
        }
    } );
}

setupValidator( newPlanetRadius, radiusGroup, validateRadius );
setupValidator( newPlanetMass, massGroup, validateMass );
setupValidator( newPlanetColor, colorGroup, validateColor );
setupValidator( timeFactorInput, timeFactorGroup, validateTimeFactor );


/* Presets */

function Preset( name, radius, mass, color )
{
    this.name = name;
    this.radius = radius;
    this.mass = mass;
    this.color = color;
}

var defaultPreset = new Preset( "Earth", "6378.1", "5.9742x10^24", "#008300" );

var presets = [
    new Preset( "Sun", "696000", "1.9897x10^30", "#FFDD00" ),
    new Preset( "Mercury", "2439.64", "3.3022x10^23", "#511800" ),
    defaultPreset,
    new Preset( "Venus", "6051.59", "4.8690x10^24", "#A49800" ),
    new Preset( "Moon", "1737.1", "7.3477x10^22", "#7A7A7A" ),
    new Preset( "Mars", "3397.00", "6.4191x10^23", "#A51D08" ),
    new Preset( "Jupiter", "71492.68", "1.8987x10^27", "#BF250D" ),
    new Preset( "Saturn", "60267.14", "5.6851x10^26", "#C8CF19" ),
    new Preset( "Uranus", "25557.25", "8.6849x10^25", "#8EE3FA" ),
    new Preset( "Neptune", "24766.36", "1.0244x10^26", "#1212FF" ),
    new Preset( "Pluto", "1184", "1.3x10^22", "#424242" ),
    new Preset( "Black Hole", "10x10^3", "2.0x10^33", "#0F0036" )
];

function setPresetButtonText( name )
{
    presetButton.innerHTML = name + ' <span class="caret">';
}

function onPresetElementClick( preset )
{
    newPlanetRadius.value = preset.radius;
    newPlanetMass.value = preset.mass;
    newPlanetColor.value = preset.color;
    setPresetButtonText( preset.name );
}

function addPresetElement( preset )
{
    var li = document.createElement( "li" );
    var a = document.createElement( "a" );
    a.innerText = preset.name;
    a.addEventListener( "click", function()
    {
        onPresetElementClick( preset );
    } );
    li.appendChild( a );
    presetDropdown.appendChild( li );
}

function addPresets()
{
    presets.forEach( function( preset )
    {
        addPresetElement( preset );
    } );
    var li = document.createElement( "li" );
    li.classList.add( "divider" );
    presetDropdown.appendChild( li );
    addPresetElement( new Preset( "Custom", "0", "0", "#000000" ) );
}


/* Utilities */

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
var maxPathPoints = 100000;

var minSpeed = 5477.8; // m/s, Speed of Neptune around the Sun
var maxSpeed = 47872.5; // m/s, Speed of Mercury around the Sun

var minMass = 3.3022 * Math.pow( 10, 23 ); // kg, Mercury mass
var maxMass = 1.0243 * Math.pow( 10, 26 ); // kg, Neptune mass

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
    this.speed = new Vector( 0, 0 );
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
            var lastPosition = this.path[ this.path.length - 1 ];
            var currentPosition = this.position.toPixels();
            var dist = distance( lastPosition, currentPosition );
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
        drawLines( context, this.path, this.pathColor, 1.0 );
        var pixelLoc = this.position.toPixels();
        var pixelRadius = this.radius * meterToPixel;
        fillCircle( context, pixelLoc.x, pixelLoc.y, pixelRadius, this.color );
    };
}

function updateBodies( elapsedTime )
{
    if( !paused )
    {
        elapsedTime *= timeFactor;
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
    if( createdPlanet != null && heldRay != null )
    {
        drawRay( context, heldRay.toPixels(), createdPlanet.position.toPixels(), "green" );
        createdPlanet.paint();
    }
}


/* Planet Creation */

function convertToNumber( value )
{
    value = removeAllWhiteSpace( value );
    value = value.replace( /x10\^/, "e" );
    return Number( value );
}

function getEnteredRadius()
{
    return convertToNumber( newPlanetRadius.value );
}

function validateRadius()
{
    var radius = getEnteredRadius();
    return !isNaN( radius ) && radius > 0;
}

function getEnteredMass()
{
    return convertToNumber( newPlanetMass.value );
}

function validateMass()
{
    var mass = getEnteredMass();
    return !isNaN( mass ) && mass > 0;
}

function getEnteredColor()
{
    var color = removeAllWhiteSpace( newPlanetColor.value.toString() );
    if( validHexColorString( color ) )
    {
        return color;
    }
    else
    {
        return null;
    }
}

function getTimeFactor()
{
    return Number( timeFactorInput.value );
}

function validateTimeFactor()
{
    var timeFactor = getTimeFactor();
    return !isNaN( timeFactor );
}

function validateColor()
{
    return getEnteredColor() != null;
}

var createdPlanet = null;

function createPlanet()
{
    if( validateRadius() && validateRadius() && validateColor() )
    {
        var radius = getEnteredRadius();
        var mass = getEnteredMass();
        var color = getEnteredColor();
        createdPlanet = new Body( 0, 0 );
        createdPlanet.radius = radius * 1000;
        createdPlanet.mass = mass;
        createdPlanet.color = color;
        $( "#done" ).click();
        setCurrentAction( creatingPlanetAction );
        return true;
    }
    return false;
}

createPlanetButton.addEventListener( "click", function()
{
    if( createPlanet() )
    {
        $( "#newPlanetModal" ).modal( "hide" );
    }
} );


/* Input Handler */

var noAction = "noAction";
var zoomInAction = zoomInButton.id;
var zoomOutAction = zoomOutButton.id;
var moveAction = moveButton.id;
var creatingPlanetAction = "creatingPlanet";

var currentAction;
setCurrentAction( noAction );

function setCurrentAction( action )
{
    currentAction = action;
    switch( currentAction )
    {
        case zoomInAction:
            canvas.style.cursor = "zoom-in";
            break;
        case zoomOutAction:
            canvas.style.cursor = "zoom-out";
            break;
        case moveAction:
            canvas.style.cursor = "move";
            break;
        default:
            canvas.style.cursor = "auto";
            break;
    }
}

function onActionButtonClick( e )
{
    setCurrentAction( e.target.id );
}

zoomInButton.onchange = onActionButtonClick;
zoomOutButton.onchange = onActionButtonClick;
moveButton.onchange = onActionButtonClick;
doneButton.onchange = onActionButtonClick;

var inputMoveThreshold = 20;

var down = false;
var heldRay = null;
var dragStart;
var lastX, lastY;

canvas.addEventListener( "pointerdown", function( e )
{
    e.preventDefault();
    var p = getRelativeCoordinates( e );
    lastX = p.x;
    lastY = p.y;
    p = context.transformedPoint( p.x, p.y );

    down = true;
    if( currentAction == creatingPlanetAction )
    {
        var x = p.x * pixelToMeter;
        var y = p.y * pixelToMeter;
        createdPlanet.position.x = x;
        createdPlanet.position.y = y;
        heldRay = new Vector( x, y );
    }
    else if( currentAction == moveAction )
    {
        dragStart = p;
    }
} );

canvas.addEventListener( "pointermove", function( e )
{
    e.preventDefault();
    var p = getRelativeCoordinates( e );
    lastX = p.x;
    lastY = p.y;
    p = context.transformedPoint( p.x, p.y );

    if( down )
    {
        if( currentAction == creatingPlanetAction )
        {
            createdPlanet.position.x = p.x * pixelToMeter;
            createdPlanet.position.y = p.y * pixelToMeter;
        }
        else if( currentAction == moveAction )
        {
            context.translate( p.x - dragStart.x, p.y - dragStart.y );
        }
    }
} );

canvas.addEventListener( "pointerup", function( e )
{
    e.preventDefault();
    var p = getRelativeCoordinates( e );
    p = context.transformedPoint( p.x, p.y );

    if( down )
    {
        down = false;
        if( currentAction == creatingPlanetAction )
        {
            var rayPixelLoc = heldRay.toPixels();
            var bodyPixelLoc = createdPlanet.position.toPixels();
            var dist = distance( bodyPixelLoc, rayPixelLoc );
            if( dist < inputMoveThreshold )
            {
                createdPlanet.fixed = true;
                createdPlanet.speed = new Vector( 0, 0 );
                bodies.push( createdPlanet );
            }
            else
            {
                var xDiff = rayPixelLoc.x - bodyPixelLoc.x;
                var yDiff = rayPixelLoc.y - bodyPixelLoc.y;
                createdPlanet.speed.x = maxSpeed / canvas.width * xDiff;
                createdPlanet.speed.y = maxSpeed / canvas.height * yDiff;
                bodies.unshift( createdPlanet );
                createdPlanet.updatePath();
            }
            createdPlanet = null;
            heldRay = null;
            setCurrentAction( noAction );
        }
        else if( currentAction == zoomOutAction )
        {
            zoom( -1 );
        }
        else if( currentAction == zoomInAction )
        {
            zoom( 1 );
        }
    }
} );

function inputCancel()
{
    down = false;
    if( currentAction == creatingPlanetAction )
    {
        createdPlanet = null;
        heldRay = null;
        setCurrentAction( noAction );
    }
}

canvas.addEventListener( "pointerout", function( e )
{
    e.preventDefault();
    inputCancel()
} );

canvas.addEventListener( "pointercancel", function( e )
{
    e.preventDefault();
    inputCancel()
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
    trackTransforms( context );
    addPresets();
    onPresetElementClick( defaultPreset );
    startAnimation( updateBodies, render );
}

main();
