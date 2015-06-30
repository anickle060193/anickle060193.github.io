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

var saveSettingsInput = document.getElementById( "saveSettings" );

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

var increment = 0.1;
var tolerance = 1;

var spirograph = null;

function equalWithin( p1, p2, tolerance )
{
    var xDiff = p1.x - p2.x;
    var yDiff = p1.y - p2.y;
    var dist = Math.sqrt( xDiff * xDiff + yDiff + yDiff );
    return dist < tolerance;
}

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

Spirograph.prototype.getPoint = function( t )
{
    var x = this.R * ( this._a * Math.cos( t ) + this._c * Math.cos( this._b * t ) );
    var y = this.R * ( this._a * Math.sin( t ) - this._c * Math.sin( this._b * t ) );
    return new Point( x, y );
};

Spirograph.prototype.createPath = function()
{
    this.path = [ ];

    this._a = 1 - this.k;
    this._b = this._a / this.k;
    this._c = this.l * this.k;

    var t = 0;
    for( var i = 0; i < this.iterations; i++ )
    {
        this.path.push( this.getPoint( t ) );
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
    render();
}


/* Input */

var url_k = "k";
var url_l = "l";
var url_R = "R";
var url_color = "c";
var url_lineWidth = "lw";
var url_step = "s";
var url_iterations = "i";

// From: http://stackoverflow.com/a/2880929
var urlParams;
( function getUrlParams()
{
    var match;
    var pl = /\+/g;  // Regex for replacing addition symbol with a space
    var search = /([^&=]+)=?([^&]*)/g;
    var decode = function( s )
    {
        return decodeURIComponent( s.replace( pl, " " ) );
    };
    var query = window.location.search.substring( 1 );

    urlParams = { };
    while( match = search.exec( query ) )
    {
        urlParams[ decode( match[ 1 ] ) ] = decode( match[ 2 ] );
    }
} )();

// From: http://stackoverflow.com/a/111545
function encodeQueryData( data )
{
    var ret = [ ];
    for ( var d in data )
    {
        ret.push( encodeURIComponent( d ) + "=" + encodeURIComponent( data[ d ] ) );
    }
    return ret.join( "&" );
}

function createURL()
{
    var url = [ location.protocol, '//', location.host, location.pathname ].join( '' );
    if( validation.allValid() )
    {
        var data = { };
        data[ url_k ] = Number( kInput.value );
        data[ url_l ] = Number( lInput.value );
        data[ url_R ] = Number( Rinput.value );
        data[ url_color ] = getColor().substring( 1 );
        data[ url_lineWidth ] = Number( lineWidthInput.value );
        data[ url_step ] = Number( stepInput.value );
        data[ url_iterations ] = Number( iterationsInput.value );

        url += "?" + encodeQueryData( data );
    }
    return url;
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
    setInputs( urlParams )
    createSpirograph();
    setupValidators();
    render();
} )();
