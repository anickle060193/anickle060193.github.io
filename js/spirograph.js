/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var kInput = document.getElementById( "k" );
var kGroup = document.getElementById( "kGroup" );

var lInput = document.getElementById( "l" );
var lGroup = document.getElementById( "lGroup" );

var Rinput = document.getElementById( "R" );
var Rgroup = document.getElementById( "Rgroup" );

var colorInput = document.getElementById( "color" );
var colorGroup = document.getElementById( "colorGroup" );

var lineWidthInput = document.getElementById( "lineWidth" );
var lineWidthGroup = document.getElementById( "lineWidthGroup" );

var stepInput = document.getElementById( "step" );
var stepGroup = document.getElementById( "stepGroup" );

var iterationsInput = document.getElementById( "iterations" );
var iterationsGroup = document.getElementById( "iterationsGroup" );

var draw = document.getElementById( "draw" );

var openSettingsButton = document.getElementById( "openSettings" );
var saveSettingsInput = document.getElementById( "saveSettings" );
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


/* Validation */

function setupValidators()
{
    validation.addValidator( kInput, kGroup, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 <= num && num <= 1;
    } );
    validation.addValidator( lInput, lGroup, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 <= num && num <= 1;
    } );
    validation.addValidator( Rinput, Rgroup, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 < num;
    } );
    validation.addValidator( colorInput, colorGroup, function( input )
    {
        return getColor() != null;
    } );
    validation.addValidator( lineWidthInput, lineWidthGroup, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 <= num;
    } );
    validation.addValidator( stepInput, stepGroup, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 < num;
    } );
    validation.addValidator( iterationsInput, iterationsGroup, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 < num;
    } );
}


/* Spirograph */

var spirograph = null;

function Spirograph( l, k, R, color, lineWidth, step, iterations )
{
    this.color = color;
    this.lineWidth = lineWidth;

    this.step = step;
    this.iterations = iterations;

    this.path = [ ];
    this.l = l;
    this.k = k;
    this.R = R;

    this._a = 1 - this.k;
    this._b = this._a / this.k;
    this._c = l * k;

    this.createPath();
}

Spirograph.prototype.createPath = function()
{
    this.path = [ ];

    this._a = 1 - this.k;
    this._b = this._a / this.k;
    this._c = this.l * this.k;

    var t = 0;
    for( var i = 0; i < this.iterations; i++ )
    {
        var x = this.R * ( this._a * Math.cos( t ) + this._c * Math.cos( this._b * t ) );
        var y = this.R * ( this._a * Math.sin( t ) - this._c * Math.sin( this._b * t ) );
        this.path.push( new Point( x, y ) );
        t += this.step;
    }
};

Spirograph.prototype.draw = function()
{
    context.strokeStyle = this.color;
    context.lineWidth = this.lineWidth;
    context.beginPath();
    for( var i = 0; i < this.path.length; i++ )
    {
        var p = this.path[ i ];
        context.lineTo( p.x, p.y );
    }
    context.stroke();
};

function createSpirograph()
{
    var l = Number( lInput.value );
    var k = Number( kInput.value );
    var R = Number( Rinput.value );
    var lineWidth = Number( lineWidthInput.value );
    var color = getColor();
    var step = Number( stepInput.value );
    var iterations = Number( iterationsInput.value );

    saveSettings.value = createURL();

    spirograph = new Spirograph( l, k, R, color, lineWidth, step, iterations );
    setUrl();
    render();
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

var url_k = "k";
var url_l = "l";
var url_R = "R";
var url_color = "c";
var url_lineWidth = "lw";
var url_step = "s";
var url_iterations = "i";

function createURL()
{
    var data = { };
    if( spirograph != null )
    {
        data[ url_k ] = spirograph.k;
        data[ url_l ] = spirograph.l;
        data[ url_R ] = spirograph.R;;
        data[ url_color ] = spirograph.color.substring( 1 );
        data[ url_lineWidth ] = spirograph.lineWidth;
        data[ url_step ] = spirograph.step;
        data[ url_iterations ] = spirograph.iterations;
    }
    return urlSettings.createURL( data );
}

function createRandomSpirograph()
{
    kInput.value = random( 0.2, 1.0 );
    lInput.value = random( 0.2, 1.0 );
    Rinput.value = random( 500, 600 );
    createSpirograph();
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

draw.addEventListener( "click", function()
{
    if( validation.allValid() )
    {
        $( ".modal" ).modal( "hide" );

        createSpirograph();
    }
} );

randomButton.addEventListener( "click", function()
{
    createRandomSpirograph();
} );

openSettingsButton.addEventListener( "click", function()
{
    setUrl();
} );

function setUrl()
{
    var newURL = createURL();
    saveSettings.value = newURL;
    history.replaceState( null, "", newURL );
}

function setInputs( data )
{
    if( data[ url_k ] !== undefined )
    {
        kInput.value = data[ url_k ];
    }
    if( data[ url_l ] !== undefined )
    {
        lInput.value = data[ url_l ];
    }
    if( data[ url_R ] !== undefined )
    {
        Rinput.value = data[ url_R ];
    }
    if( data[ url_color ] !== undefined )
    {
        colorInput.value = "#" + data[ url_color ];
    }
    if( data[ url_lineWidth ] !== undefined )
    {
        lineWidth.value = data[ url_lineWidth ];
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
    var num = Number( timeFactorInput.value );
    if( isFinite( num ) )
    {
        timeFactor = num;
    }
} );


/* Animation */

var animating = false;
var timeFactor = 0.01

function update( elapsedTime )
{
    if( animating && spirograph != null )
    {
        var delta = elapsedTime * timeFactor;
        spirograph.k = ( spirograph.k + delta ) % 1;
        spirograph.l = ( spirograph.l + delta ) % 1;
        spirograph.createPath();
        render();
    }
}


/* Render */

function render()
{
    clear( context );

    if( spirograph != null )
    {
        spirograph.draw();
    }
}


/* Main */

( function()
{
    onWindowResize();
    setInputs( urlSettings.getUrlData() )
    createSpirograph();
    setupValidators();
    render();

    startAnimation( update, function() { } );
} )();
