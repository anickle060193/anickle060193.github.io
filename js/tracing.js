/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var colorInput = document.getElementById( "color" );
var lineWidthInput = document.getElementById( "lineWidth" );
var stepInput = document.getElementById( "step" );
var iterationsInput = document.getElementById( "iterations" );
var smoothInput = document.getElementById( "smooth" );

var openSettingsButton = document.getElementById( "openSettings" );
var typeSelect = document.getElementById( "type" );
var drawButton = document.getElementById( "draw" );

var randomButton = document.getElementById( "random" );

var animateButton = document.getElementById( "animate" );
var animateIcon = document.getElementById( "animateIcon" );
var timeFactorInput = document.getElementById( "timeFactor" );

function onWindowResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    context.setTransform( 1, 0, 0, 1, canvas.width / 2, canvas.height / 2 );

    render();
}

onDebouncedWindowResize( onWindowResize );

$( '[ data-toggle="popover" ]' ).popover();
$( ".collapse" ).collapse( "hide" );

/* Validation */

var display = new ValidationGroup();

function setupValidators()
{
    display.addValidator( colorInput, colorInput.parentNode, function( input )
    {
        return getColor() != null;
    } );
    display.addValidator( lineWidthInput, lineWidthInput.parentNode, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 <= num;
    } );
    display.addValidator( stepInput, stepInput.parentNode, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 < num;
    } );
    display.addValidator( iterationsInput, iterationsInput.parentNode, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 < num;
    } );
}


/* Tracing */

var tracing = null;

function Tracing( data, color, lineWidth, smooth, step, iterations )
{
    this.color = color;
    this.lineWidth = lineWidth;
    this.smooth = smooth;

    this.step = step;
    this.iterations = iterations;

    this.path = [ ];
    this.createPath();
}

Tracing.prototype.createPath = function()
{
};

Tracing.prototype.draw = function( smooth )
{
    if( this.smooth )
    {
        drawSmoothLines( context, this.path, this.color, this.lineWidth );
    }
    else
    {
        drawLines( context, this.path, this.color, this.lineWidth );
    }
};

function createTracing()
{

}

function createRandomTracing()
{
    createTracing();
}

function TracingDOM( name, input, group )
{
    this.name = name;
    if( typeof( input ) === "string" )
    {
        this.input = document.getElementById( input );
    }
    else if( input instanceof HTMLElement )
    {
        this.input = input;
    }
    else
    {
        throw new Error( "Input must be of type string or HTMLElement." );
    }
    if( typeof( group ) === "string" )
    {
        this.group = document.getElementById( group );
    }
    else if( group instanceof HTMLElement )
    {
        this.group = group;
    }
    else
    {
        throw new Error( "Group must be of type string or HTMLElement." );
    }
}


/* Input */

animateButton.addEventListener( "click", function()
{
    animating = !animating;
    if( animating )
    {
        animateButton.classList.remove( "btn-success" );
        animateButton.classList.add( "btn-danger" );
        animateIcon.classList.remove( "glyphicon-play" );
        animateIcon.classList.add( "glyphicon-stop" );
    }
    else
    {
        animateButton.classList.add( "btn-success" );
        animateButton.classList.remove( "btn-danger" );
        animateIcon.classList.add( "glyphicon-play" );
        animateIcon.classList.remove( "glyphicon-stop" );
        setUrl();
        setInputs( urlSettings.getUrlData() );
    }
} );

var url_color = "c";
var url_lineWidth = "lw";
var url_smooth = "sm";
var url_step = "s";
var url_iterations = "i";

function createURL()
{
    var data = { };
    if( tracing != null )
    {
        data[ url_color ] = tracing.color.substring( 1 );
        data[ url_lineWidth ] = tracing.lineWidth;
        data[ url_smooth ] = tracing.smooth;
        data[ url_step ] = tracing.step;
        data[ url_iterations ] = tracing.iterations;
    }
    return urlSettings.createURL( data );
}

function getColor()
{
    var color = removeAllWhiteSpace( colorInput.value.toString() );
    if( validHexColorString( color ) )
    {
        return color;
    }
    else
    {
        return null;
    }
}

typeSelect.addEventListener( "change", function()
{

} );

drawButton.addEventListener( "click", function()
{
    if( display.allValid() )
    {
        $( ".modal" ).modal( "hide" );

        createTracing();
    }
} );

randomButton.addEventListener( "click", function()
{
    createRandomTracing();
} );

openSettingsButton.addEventListener( "click", function()
{
    setUrl();
} );

function setUrl()
{
    history.replaceState( null, "", createURL() );
}

function setInputs( data )
{
    if( data[ url_color ] !== undefined )
    {
        colorInput.value = "#" + data[ url_color ];
    }
    if( data[ url_lineWidth ] !== undefined )
    {
        lineWidth.value = data[ url_lineWidth ];
    }
    if( data[ url_smooth ] !== undefined )
    {
        smoothInput.selectedIndex = data[ url_smooth ] == "true" ? 0 : 1;
    }
    if( data[ url_step ] !== undefined )
    {
        stepInput.value = data[ url_step ];
    }
    if( data[ url_iterations ] !== undefined )
    {
        iterationsInput.value = data[ url_iterations ];
    }
}

timeFactorInput.addEventListener( "change", function()
{
    if( timeFactorInput.value !== "" )
    {
        var num = Number( timeFactorInput.value );
        if( isFinite( num ) )
        {
            timeFactor = num;
        }
    }
} );


/* Animation */

var animating = false;
var timeFactor = 0.1

function update( elapsedTime )
{
    if( animating && tracing != null )
    {
        var delta = elapsedTime * timeFactor;
        tracing.createPath();
        render();
    }
}


/* Render */

function render()
{
    clear( context );

    if( tracing != null )
    {
        tracing.draw();
    }
}


/* Main */

( function()
{
    onWindowResize();
    setInputs( urlSettings.getUrlData() )
    createTracing();
    setupValidators();
    render();

    startAnimation( update, function() { } );
} )();
