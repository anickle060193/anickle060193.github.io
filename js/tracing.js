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

function setupDisplayValidators()
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
    var collapse = $( "#spirographSettings" );

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

    var setData = function( data, inputs )
    {
        data.k = Number( inputs.k.value );
        data.l = Number( inputs.l.value );
        data.R = Number( inputs.R.value );
    };
    var setInputs = function( data, inputs )
    {
        if( data.k !== undefined )
        {
            inputs.k.value = data.k;
        }
        if( data.l !== undefined )
        {
            inputs.l.value = data.l;
        }
        if( data.R !== undefined )
        {
            inputs.R.value = data.R;
        }
    };

    var createPath = function( data )
    {
        var path = [ ];

        var a = 1 - data.k;
        var b = a / data.k;
        var c = data.l * data.k;

        var t = 0;
        for( var i = 0; i < data.i; i++ )
        {
            var x = data.R * ( a * Math.cos( t ) + c * Math.cos( b * t ) );
            var y = data.R * ( a * Math.sin( t ) - c * Math.sin( b * t ) );
            path.push( new Point( x, y ) );
            t += data.s;
        }
        return path;
    };
    var randomize = function( data )
    {
        data.k = Math.random();
        data.l = Math.random();
    };
    var update = function( data, elapsedTime )
    {
        data.k = ( data.k + elapsedTime ) % 1;
        data.l = ( data.l + elapsedTime ) % 1;
    };
    return new Tracing( "Spirograph", validation, setData, setInputs, createPath, randomize, update, collapse, inputs );
} )();

tracings[ "Harmonograph" ] = ( function()
{
    var collapse = $( "#harmonographSettings" );

    var validation = new ValidationGroup();
    var inputs = { f: [ ], p: [ ], A: [ ], d: [ ] };

    var hasNonnegativeValue = function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 <= num;
    };
    for( var i = 1; i <= 4; i++ )
    {
        inputs.f[ i ] = validation.addValidator( document.getElementById( "f" + i ), hasNonnegativeValue ).input;
        inputs.p[ i ] = validation.addValidator( document.getElementById( "p" + i ), hasNonnegativeValue ).input;
        inputs.A[ i ] = validation.addValidator( document.getElementById( "A" + i ), hasNonnegativeValue ).input;
        inputs.d[ i ] = validation.addValidator( document.getElementById( "d" + i ), hasNonnegativeValue ).input;
    }

    var setData = function( data, inputs )
    {
        for( var i = 1; i <= 4; i++ )
        {
            data[ "f" + i ] = Number( inputs.f[ i ].value );
            data[ "p" + i ] = Number( inputs.p[ i ].value );
            data[ "A" + i ] = Number( inputs.A[ i ].value );
            data[ "d" + i ] = Number( inputs.d[ i ].value );
        }
    };
    var setInputs = function( data, inputs )
    {
        for( var i = 1; i <= 4; i++ )
        {
            if( data[ "f" + i ] !== undefined )
            {
                inputs.f[ i ].value = data[ "f" + i ];
            }
            if( data[ "p" + i ] !== undefined )
            {
                inputs.p[ i ].value = data[ "p" + i ];
            }
            if( data[ "A" + i ] !== undefined )
            {
                inputs.A[ i ].value = data[ "A" + i ];
            }
            if( data[ "d" + i ] !== undefined )
            {
                inputs.d[ i ].value = data[ "d" + i ];
            }
        }
    };

    var createPath = function( data )
    {
        var path = [ ];

        var t = 0;
        for( var i = 0; i < data.i; i++ )
        {
            var x1 = data[ "A1" ] * Math.sin( t * data[ "f1" ] + data[ "p1" ] ) * Math.exp( - data[ "d1" ] * t );
            var x2 = data[ "A2" ] * Math.sin( t * data[ "f2" ] + data[ "p2" ] ) * Math.exp( - data[ "d2" ] * t );
            var y1 = data[ "A3" ] * Math.sin( t * data[ "f3" ] + data[ "p3" ] ) * Math.exp( - data[ "d3" ] * t );
            var y2 = data[ "A4" ] * Math.sin( t * data[ "f4" ] + data[ "p4" ] ) * Math.exp( - data[ "d4" ] * t );
            path.push( new Point( x1 + x2, y1 + y2 ) );
            t += data.s;
        }
        return path;
    };
    var randomize = function( data )
    {
        for( var i = 1; i <= 4; i++ )
        {
            data[ "f" + i ].value = random( 200 );
            data[ "p" + i ].value = random( 100 );
            data[ "A" + i ].value = random( 300 );
            data[ "d" + i ].value = random( 0.5 );
        }
    };
    var update = function( data, elapsedTime )
    {
        for( var i = 1; i <= 4; i++ )
        {
            data[ "f" + i ] = ( data[ "f" + i ] + elapsedTime );
        }
    };
    return new Tracing( "Harmonograph", validation, setData, setInputs, createPath, randomize, update, collapse, inputs );
} )();

var currentTracing = null;

function Tracing( name, validation, setData, setInputs, createPath, randomize, update, collapse, inputs )
{
    this.name = name;
    this.validation = validation;
    this._setData = setData;
    this._setInputs = setInputs;
    this._createPath = createPath;
    this._randomize = randomize;
    this._update = update;
    this.collapse = collapse;
    this.inputs = inputs;

    this.data = { };
    this.path = [ ];
}
Tracing.prototype.setData = function()
{
    this.data = { };
    this.data.type = this.name;
    this.data.lw = Number( lineWidthInput.value );
    this.data.sm = ( smoothInput.selectedIndex === 0 ).toString();
    this.data.c = getColor();
    this.data.s = Number( stepInput.value );
    this.data.i = Number( iterationsInput.value );
    this._setData( this.data, this.inputs );
};
Tracing.prototype.setInputs = function()
{
    if( this.data.type !== undefined )
    {
        typeSelect.value = this.data.type;
    }
    if( this.data.c !== undefined )
    {
        colorInput.value = this.data.c;
    }
    if( this.data.lw !== undefined )
    {
        lineWidth.value = this.data.lw;
    }
    if( this.data.sm !== undefined )
    {
        smoothInput.selectedIndex = this.data.sm == "true" ? 0 : 1;
    }
    if( this.data.s !== undefined )
    {
        stepInput.value = this.data.s;
    }
    if( this.data.i !== undefined )
    {
        iterationsInput.value = this.data.i;
    }
    this._setInputs( this.data, this.inputs );

    this.setData();
    setUrl();
};
Tracing.prototype.createPath = function()
{
    this.path = this._createPath( this.data );
};
Tracing.prototype.randomize = function()
{
    this._randomize( this.data );
};
Tracing.prototype.update = function( elapsedTime )
{
    this._update( this.data, elapsedTime );
};
Tracing.prototype.draw = function()
{
    if( this.data.sm === "true" )
    {
        drawSmoothLines( context, this.path, this.data.c, this.data.lw );
    }
    else
    {
        drawLines( context, this.path, this.data.c, this.data.lw );
    }
};

function setTracing( tracingName )
{
    if( currentTracing != null )
    {
        currentTracing.collapse.collapse( "hide" );
    }
    currentTracing = tracings[ tracingName ];
    currentTracing.collapse.collapse( "show" );
    typeSelect.value = tracingName;
}

function recreateTracing()
{
    currentTracing.setData();
    currentTracing.createPath();

    render();
}

function recreateRandomTracing()
{
    currentTracing.randomize();
    recreateTracing();
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
        currentTracing.setInputs();
    }
} );

function createURL()
{
    if( currentTracing )
    {
        return urlSettings.createURL( currentTracing.data );
    }
    else
    {
        return urlSettings.createURL();
    }
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
    setTracing( typeSelect.value );
} );

drawButton.addEventListener( "click", function()
{
    if( display.allValid() && currentTracing.validation.allValid() )
    {
        $( ".modal" ).modal( "hide" );

        recreateTracing();
    }
} );

randomButton.addEventListener( "click", function()
{
    recreateRandomTracing();
} );

openSettingsButton.addEventListener( "click", function()
{
    setUrl();
    currentTracing.setInputs();
} );

function setUrl()
{
    history.replaceState( null, "", createURL() );
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
    if( animating )
    {
        var delta = elapsedTime * timeFactor;
        currentTracing.update( delta );
        currentTracing.createPath();
        render();
    }
}


/* Render */

function render()
{
    clear( context );

    if( currentTracing )
    {
        currentTracing.draw();
    }
}


/* Main */

( function()
{
    onWindowResize();
    var data = urlSettings.getUrlData();
    if( data.type !== undefined && tracings[ data.type ] !== undefined )
    {
        setTracing( data.type );
    }
    else
    {
        setTracing( "Harmonograph" );
    }
    currentTracing.data = urlSettings.getUrlData();
    currentTracing.setInputs();
    recreateTracing();
    setupDisplayValidators();
    render();

    startAnimation( update, function() { } );
} )();
