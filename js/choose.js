/* Document Elements */

var mainContent = document.getElementById( "mainContent" );
var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );
context.translate( 0.5, 0.5 );

function onResize()
{
    canvas.width = mainContent.clientWidth;
    canvas.height = mainContent.clientHeight;

    var minSize = Math.min( canvas.height, canvas.width );

    textHeight = minSize * 0.1;
    textHeight *= Math.pow( 0.95, choices.length );

    textOffset = minSize * 0.05;

    render();
}

var resizeTimeout;
window.addEventListener( "resize", function()
{
    clearTimeout( resizeTimeout );
    resizeTimeout = setTimeout( onResize, 250 );
} );

var spinWheelButton = document.getElementById( "spinWheel" );
spinWheelButton.addEventListener( "click", spin );

var choicesTextArea = document.getElementById( "choices" );

window.onload = function()
{
    $( "#choicesModal" ).on( 'hidden.bs.modal', function()
    {
        updateChoices();
    } );
};

var saveChoicesButton = document.getElementById( "saveChoices" );
saveChoicesButton.addEventListener( "click", function()
{
    $( "#choicesModal" ).modal( "hide" );
    $( "#saveChoicesInput" ).val( getChoicesURL() );
    $( "#saveChoicesModal" ).modal( "show" );
} );


/* Utilities */

var seed = 1;
function fixedRandom()
{
    var x = Math.sin( seed++ ) * 10000;
    return x - Math.floor( x );
}

function randomColor()
{
    var r = Math.floor( fixedRandom() * 256 );
    var g = Math.floor( fixedRandom() * 256 );
    var b = Math.floor( fixedRandom() * 256 );
    return "rgb( " + r + "," + g + "," + b + ")";
}

function random( min, max )
{
    return Math.random() * ( max - min ) + min;
}


/* Wheel */

function fillCircle( c, x, y, radius, fillStyle )
{
    c.beginPath();
    c.arc( x, y, radius, 0, 2 * Math.PI, false );
    c.fillStyle = fillStyle;
    c.fill();
}

var colors = [ ];
var textHeight = 50;
var textOffset = 0;

function drawWheel( x, y, radius, segmentStrings )
{
    var tempCanvas = document.createElement( "canvas" );
    var tempContext = tempCanvas.getContext( "2d" );
    tempCanvas.width = tempCanvas.height = radius * 2;
    tempContext.translate( radius, radius );

    var segments = segmentStrings.length;
    var segmentAngle = 2 * Math.PI / segments;
    for( var i = 0; i < segments; i++ )
    {
        tempContext.beginPath();
        if( colors.length < i + 1 )
        {
            colors.push( randomColor() );
        }
        tempContext.fillStyle = colors[ i ];
        tempContext.arc( 0, 0, radius, -segmentAngle, 0 );
        tempContext.lineTo( 0, 0 );
        tempContext.fill();

        tempContext.rotate( -segmentAngle / 2 );

        tempContext.fillStyle = "black";
        tempContext.font = textHeight.toString() + "px Verdana";
        var text = segmentStrings[ i ];
        var size = tempContext.measureText( text );
        tempContext.fillText( text, radius - size.width - textOffset, textHeight / 2 );

        tempContext.rotate( -segmentAngle / 2 );
    }

    context.save();
    context.translate( x, y );
    context.save();
    context.rotate( -rotationAngle );

    fillCircle( context, 3, 3, radius, "rgba( 128, 128, 128, 0.8 )" );
    context.drawImage( tempCanvas, -radius, -radius, radius * 2, radius * 2 );

    context.restore();

    context.fillStyle = "black";
    context.beginPath();
    var arrowSize = 0.08;
    context.moveTo( radius * ( 1 - arrowSize ), 0 );
    context.lineTo( radius * ( 1 + arrowSize ), radius * arrowSize );
    context.lineTo( radius * ( 1 + arrowSize ), -radius * arrowSize );
    context.fill();

    context.restore();
}

var rotationAngle = 0;

var maxRotationSpeed = 2 * Math.PI * 3.5;
var minRotationSpeed = 2 * Math.PI * 2.8;

var maxRotationSpeedDecreaseDelay = 1000 * 1.2;
var minRotationSpeedDecreaseDelay = 1000 * 0.8;

var minRotationSpeedDecreaseRate = 2 * Math.PI * 0.9;
var maxRotationSpeedDecreaseRate = 2 * Math.PI * 0.6;

var rotationSpeed = 0;
var rotationSpeedDecreaseDelay = 0;
var rotationSpeedDecreaseRate = 0;

var spinStart = 0;

function spin()
{
    updateChoices();

    rotationSpeed = random( minRotationSpeed, maxRotationSpeed );
    rotationSpeedDecreaseDelay = random( minRotationSpeedDecreaseDelay, maxRotationSpeedDecreaseDelay );
    rotationSpeedDecreaseRate = random( minRotationSpeedDecreaseRate, maxRotationSpeedDecreaseRate );

    spinStart = new Date().getTime();
}

function update( elapsedTime )
{
    if( rotationSpeed > 0 )
    {
        rotationAngle += rotationSpeed * elapsedTime;

        if( spinStart + rotationSpeedDecreaseDelay <= new Date().getTime() )
        {
            rotationSpeed -= rotationSpeedDecreaseRate * elapsedTime;
            if( rotationSpeed < 0 )
            {
                rotationSpeed = 0;
                detectWinner();
            }
        }
    }
}


/* Choices */

var choiceCount = 0;
var choices = [ ];

function updateChoices()
{
    choices = [ ];
    var choicesText = choicesTextArea.value;
    var choicesTextSplit = choicesText.split( choicesTextAreaSeperator );
    for( var i = 0; i < choicesTextSplit.length; i++ )
    {
        if( choicesTextSplit[ i ] )
        {
            choices.push( choicesTextSplit[ i ] );
        }
    }
}

var choicesUrlBeginning = "?";
var choicesUrlSeperator = "+";
var choicesTextAreaSeperator = "\n";

function getChoicesURL()
{
    var url = window.location.href;
    var index = url.indexOf( choicesUrlBeginning );
    if( index >= 0 )
    {
        url = url.substring( 0, url.indexOf( choicesUrlBeginning ) );
    }
    url += choicesUrlBeginning;
    choices.forEach( function( choice )
    {
        url += choice + choicesUrlSeperator;
    } );
    return url;
}

function readChoicesFromURL()
{
    var url = window.location.href;
    var index = url.indexOf( choicesUrlBeginning );
    if( index >= 0 )
    {
        var choicesString = url.substring( url.indexOf( choicesUrlBeginning ) + 1 );
        var choicesSplit = choicesString.split( choicesUrlSeperator );
        choicesSplit.forEach( function( choice )
        {
            if( choice )
            {
                choicesTextArea.value += choice + choicesTextAreaSeperator;
            }
        } );
    }
    updateChoices();
}

function detectWinner()
{
    /*
    var finalAngle = ( rotationAngle + Math.PI ) % ( 2 * Math.PI );
    var segmentAngle = 2 * Math.PI / choices.length;
    var choice = 2 * Math.PI - finalAngle / segmentAngle;
    console.log( rotationAngle * 180 / ( 2 * Math.PI ) );
    console.log( finalAngle * 180 / ( 2 * Math.PI ) );
    console.log( choice );
    console.log( choices[ Math.floor( choice ) ] );
    */
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

var lastTime = 0;
function animate( time )
{
    var elapsedTime = time - lastTime;
    lastTime = time;

    render();
    update( elapsedTime / 1000 );
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
    drawWheel( canvas.width / 2, canvas.height / 2, Math.min( canvas.width, canvas.height ) / 2 * 0.8, choices );
}


/* Main */

function main()
{
    readChoicesFromURL();
    onResize();
    render();
    animate( 0 );
}

main();
