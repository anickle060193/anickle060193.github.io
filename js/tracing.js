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
    display.addValidator( colorInput, function( input )
    {
        return getColor() != null;
    } );
    display.addValidator( lineWidthInput, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 <= num;
    } );
    display.addValidator( stepInput, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 < num;
    } );
    display.addValidator( iterationsInput, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 < num;
    } );
}


/* Tracing */

var tracings = { };

tracings[ "Spirograph" ] = ( function()
{
    var collapse = document.getElementById( "spirographSettings" );

    var validation = new ValidationGroup();
    var inputs = { };
    inputs.k = validation.addValidator( "k", function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 <= num && num <= 1;
    } ).input;
    inputs.l = validation.addValidator( "l", function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 <= num && num <= 1;
    } ).input;
    inputs.R = validation.addValidator( "R", function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 < num;
    } ).input;

    var setInputData = function( data, inputs )
    {
        data.k = Number( inputs.k.value );
        data.l = Number( inputs.l.value );
        data.R = Number( inputs.R.value );
    };

    var createPath = function( data, path )
    {
        path = [ ];

        var a = 1 - data.k;
        var b = a / data.k;
        var c = data.l * data.k;

        var t = 0;
        for( var i = 0; i < data.i; i++ )
        {
            var x = data.R * ( a * Math.cos( t ) + c * Math.cos( b * t ) );
            var y = this.R * ( a * Math.sin( t ) - c * Math.sin( b * t ) );
            path.push( new Point( x, y ) );
            t += data.s;
        }
    };
    return new Tracing( validation, setInputData, createPath, collapse, inputs );
} )();

var currentTracing = tracings[ "Spirograph" ];

function Tracing( validation, setInputData, createPath, collapse, inputs )
{
    this.validation = validation;
    this.setInputData = setInputData;
    this.createPath = createPath;
    this.collapse = collapse;
    this.inputs = inputs;

    this.data = { };
    this.path = [ ];
}
Tracing.prototype.setDisplayData = function()
{
    this.data.lw = Number( lineWidthInput.value );
    this.data.sm = smoothInput.selectedIndex === 0;
    this.data.c = getColor();
    this.data.s = Number( stepInput.value );
    this.data.i = Number( iterationsInput.value );
    this.setInputData( this.data );
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

function setTracing( tracingName )
{
    var tracing = tracings[ tracingName ];
    $( tracing ).collapse( );
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

function createURL()
{
    var data = { };
    if( currentTracing != null )
    {
        currentTracing.setData( data );
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
    if( tracing)
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
    if( data.c !== undefined )
    {
        colorInput.value = "#" + data.c;
    }
    if( data.lw !== undefined )
    {
        lineWidth.value = data.lw;
    }
    if( data.sm !== undefined )
    {
        smoothInput.selectedIndex = data.sm == "true" ? 0 : 1;
    }
    if( data.s !== undefined )
    {
        stepInput.value = data.s;
    }
    if( data.i !== undefined )
    {
        iterationsInput.value = data.i;
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
