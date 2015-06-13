/* Includes */

/// <reference path="utilities.js" />


/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );
context.translate( 0.5, 0.5 );

function onResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    render();
}

onDebouncedWindowResize( onResize );

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

var winnerModal = document.getElementById( "winnerModal" );
var winnerText = document.getElementById( "winner" );


/* Wheel */

var colors = [ ];
var minFontSize = 0;
var fontSizeStep = 1;
var textColor = "#EEEEEE";

function getFontSizeOneChoice( context, text, radius, padding )
{
    var diameter = radius * 2;
    var fontSize = diameter + 1;
    var textWidth = 0;
    while( ( diameter > fontSize || diameter < ( padding * 2 + textWidth ) ) && fontSize > minFontSize )
    {
        fontSize -= fontSizeStep;
        context.font = fontSize.toString() + "px Verdana";
        textWidth = context.measureText( text ).width;
    }
    fontSize = fontSize > minFontSize ? fontSize : minFontSize;
    return fontSize;
}

function getFontSize( context, text, radius, textOffset, angle )
{
    var fontSize = getChordLength( radius - textOffset, angle );
    var chordLength = 0;
    var textWidth = radius;
    while( ( chordLength < fontSize || radius < ( textOffset + textWidth ) ) && fontSize > minFontSize )
    {
        fontSize -= fontSizeStep;
        context.font = fontSize.toString() + "px Verdana";
        textWidth = context.measureText( text ).width;
        chordLength = getChordLength( radius - textOffset - textWidth, angle );
    }
    fontSize = fontSize > minFontSize ? fontSize : minFontSize;
    return fontSize;
}

function getChordLength( radius, angle )
{
    return Math.abs( 2 * Math.sin( angle / 2 ) * radius );
}

function getRadius()
{
    return Math.min( canvas.width, canvas.height ) / 2 * 0.8;
}

function drawSegment( context, radius, angle, segmentNumber )
{
    context.beginPath();
    if( colors.length < segmentNumber + 1 )
    {
        colors.push( randomDistributedColor() );
    }
    context.fillStyle = colors[ segmentNumber ];
    context.arc( 0, 0, radius, -angle, 0 );
    context.lineTo( 0, 0 );
    context.fill();
}

function drawWheel( x, y, radius, segmentStrings )
{
    var tempCanvas = document.createElement( "canvas" );
    var tempContext = tempCanvas.getContext( "2d" );
    tempCanvas.width = tempCanvas.height = radius * 2;
    tempContext.translate( radius, radius );

    var segments = segmentStrings.length;
    var textOffset = radius * 0.05;

    if( segments > 1 )
    {
        var segmentAngle = 2 * Math.PI / segments;
        for( var i = 0; i < segments; i++ )
        {
            drawSegment( tempContext, radius, segmentAngle, i );

            tempContext.rotate( -segmentAngle / 2 );

            var text = segmentStrings[ i ];
            var fontSize = getFontSize( tempContext, text, radius, textOffset, segmentAngle );
            tempContext.font = fontSize.toString() + "px Verdana";
            tempContext.fillStyle = textColor;
            tempContext.textBaseline = "middle";
            tempContext.textAlign = "end";
            tempContext.fillText( text, radius - textOffset, 0 );

            tempContext.rotate( -segmentAngle / 2 );
        }
    }
    else
    {
        drawSegment( tempContext, radius, 2 * Math.PI, 0 );

        tempContext.rotate( -segmentAngle / 2 );

        var textSingle = segmentStrings[ 0 ];
        var fontSizeSingle = getFontSizeOneChoice( tempContext, textSingle, radius, textOffset );
        tempContext.font = fontSizeSingle.toString() + "px Verdana";
        tempContext.fillStyle = textColor;
        tempContext.textBaseline = "middle";
        tempContext.textAlign = "center";
        tempContext.fillText( textSingle, 0, 0 );
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

var maxRotations = 7;
var minRotations = 4;

var maxRotationSpeedDecreaseDelay = 1000 * 1.2;
var minRotationSpeedDecreaseDelay = 1000 * 0.8;

var minRotationSpeedDecreaseRate = 0.9;
var maxRotationSpeedDecreaseRate = 0.6;

var rotationSpeed = 0; // Rotations Per Second
var rotationSpeedDecreaseDelay = 0; // Seconds
var rotationSpeedDecreaseRate = 0; // Rotaions Per Seconds Per Seconds

var spinStart = 0;

function spin()
{
    updateChoices();

    rotationSpeedDecreaseDelay = random( minRotationSpeedDecreaseDelay, maxRotationSpeedDecreaseDelay );
    rotationSpeedDecreaseRate = random( minRotationSpeedDecreaseRate, maxRotationSpeedDecreaseRate );

    var rotations = random( minRotations, maxRotations );
    rotationSpeed = Math.sqrt( 2 * rotationSpeedDecreaseRate * rotations );

    rotationSpeedDecreaseRate *= 2 * Math.PI;
    rotationSpeed *= 2 * Math.PI;

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
    var url = decodeURIComponent( window.location.href );
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


/* Rendering */

function render()
{
    clear( context );
    drawWheel( canvas.width / 2, canvas.height / 2, getRadius(), choices );
}


/* Main */

function main()
{
    readChoicesFromURL();
    onResize();
    render();
    startAnimation( update, render );
}

main();
