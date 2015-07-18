"use strict";

/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var colorInput = document.getElementById( "color" );
var lineWidthInput = document.getElementById( "lineWidth" );
var depthInput = document.getElementById( "depth" );
var angleScaleInput = document.getElementById( "angleScale" );

var typeSelect = document.getElementById( "type" );
var drawButton = document.getElementById( "draw" );

function onWindowResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    context.setTransform( 1, 0, 0, 1, canvas.width / 2, canvas.height / 2 );

    render();
}

onDebouncedWindowResize( onWindowResize );

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
    display.addValidator( depthInput, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 <= num;
    } );
    display.addValidator( angleScaleInput, function( input )
    {
        var num = getAngleScale();
        return isFinite( num ) && 0 < num;
    } );
}


/* Utilities */

function max3( a, b, c )
{
    if( a < b )
    {
        if( b < c )
        {
            return c;
        }
        else
        {
            return b;
        }
    }
    else
    {
        if( a < c )
        {
            return c;
        }
        else
        {
            return a;
        }
    }
}


/* Fractals */

function Line( startX, startY, endX, endY )
{
    this.start = new Point( startX, startY );
    this.end = new Point( endX, endY );
}

var fractal = null;

function Fractal( lineWidth )
{
    this.lineWidth = lineWidth;
}
Fractal.prototype.draw = function()
{
};

function TreeFractal( lineWidth, depth, angleScale )
{
    Fractal.call( this, lineWidth );

    this.depth = depth;
    this.angleScale = angleScale;

    this._maxY = 0;
    this._maxX = 0;

    this._lines = [ ];
    this.generate();
}
TreeFractal.prototype = Object.create( Fractal.prototype );
TreeFractal.prototype._generate = function( x, y, angle, depth )
{
    if( depth > 0 )
    {
        var x2 = x + Math.cos( angle );
        var y2 = y + Math.sin( angle );
        this._maxX = max3( Math.abs( x ), Math.abs( x2 ), this._maxX );
        this._maxY = max3( Math.abs( y ), Math.abs( y2 ), this._maxY );
        this._lines[ depth ].push( new Line( x, y, x2, y2 ) );
        this._generate( x2, y2, angle - Math.PI * this.angleScale, depth - 1 );
        this._generate( x2, y2, angle + Math.PI * this.angleScale, depth - 1 );
    }
};
TreeFractal.prototype.generate = function()
{
    this._lines = [ ];
    for( var i = this.depth; i > 0; i-- )
    {
        this._lines[ i ] = [ ];
    }
    this._generate( 0, 0, -Math.PI / 2, this.depth );
};
TreeFractal.prototype.drawLine = function( line, color, lineWidth )
{
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.beginPath();
    var x1 = line.start.x / this._maxX * canvas.width * 0.45;
    var x2 = line.end.x / this._maxX * canvas.width * 0.45;
    var y1 = line.start.y / this._maxY * canvas.height * 0.95 + canvas.height * 0.95 / 2;
    var y2 = line.end.y / this._maxY * canvas.height * 0.95 + canvas.height * 0.95 / 2;
    context.moveTo( x1, y1 );
    context.lineTo( x2, y2 );
    context.stroke();
};
TreeFractal.prototype.draw = function()
{
    for( var i = 1; i <= this.depth; i++ )
    {
        var color = HSVtoRGB( i / this.depth, 0.85, 0.85 );
        for( var j = 0; j < this._lines[ i ].length; j++ )
        {
            this.drawLine( this._lines[ i ][ j ], color, this.lineWidth );
        }
    }
};

function DragonCurve( lineWidth, iterations )
{
    Fractal.call( this, lineWidth );
    
    this.iterations = iterations;
    this.width = { min: Number.MAX_VALUE, max: Number.MIN_VALUE };
    this.height = { min: Number.MAX_VALUE, max: Number.MIN_VALUE };
    this.translate = new Point( 0, 0 );

    this._lines = [ DragonCurve.Up ];
    this.generate();
}
DragonCurve.prototype = Object.create( Fractal.prototype );
DragonCurve.Left = "L";
DragonCurve.Right = "R";
DragonCurve.Up = "U";
DragonCurve.Down = "D";
DragonCurve.Rotate = { };
DragonCurve.Rotate[ DragonCurve.Left ] = DragonCurve.Up;
DragonCurve.Rotate[ DragonCurve.Right ] = DragonCurve.Down;
DragonCurve.Rotate[ DragonCurve.Up ] = DragonCurve.Right;
DragonCurve.Rotate[ DragonCurve.Down ] = DragonCurve.Left;
DragonCurve.Shift = { };
DragonCurve.Shift[ DragonCurve.Left ] = new Point( -1, 0 );
DragonCurve.Shift[ DragonCurve.Right ] = new Point( 1, 0 );
DragonCurve.Shift[ DragonCurve.Up ] = new Point( 0, -1 );
DragonCurve.Shift[ DragonCurve.Down ] = new Point( 0, 1 );
DragonCurve.prototype._generate = function()
{
    for( var i = this._lines.length - 1; i >= 0; i-- )
    {
        this._lines.push( DragonCurve.Rotate[ this._lines[ i ] ] );
    }
};
DragonCurve.prototype.generate = function()
{
    for( var i = 0; i < this.iterations; i++ )
    {
        this._generate();
    }
    var leftRights = 0;
    var upDowns = 0;
    for( var i = 0; i < this._lines.length; i++ )
    {
        var line = this._lines[ i ];
        if( line === DragonCurve.Left )
        {
            leftRights--;
        }
        else if( line === DragonCurve.Right )
        {
            leftRights++;
        }
        else if( line === DragonCurve.Up )
        {
            upDowns--;
        }
        else if( line === DragonCurve.Down )
        {
            upDowns++;
        }
        this.width.min = Math.min( this.width.min, leftRights );
        this.width.max = Math.max( this.width.max, leftRights );
        this.height.min = Math.min( this.height.min, upDowns );
        this.height.max = Math.max( this.height.max, upDowns );
    }
};
DragonCurve.prototype.draw = function()
{
    var width = this.width.max - this.width.min;
    var height = this.height.max - this.height.min;
    var shiftScale = Math.min( canvas.width * 0.9 / width, canvas.height * 0.9 / height );
    
    context.setTransform( 1, 0, 0, 1, canvas.width / 2, canvas.height / 2 );
    fillCircle( context, 0, 0, 5, "green" );
    
    var xShift = canvas.width / 2 - this.width.min * shiftScale / 2;
    var yShift = canvas.height / 2 - this.height.min * shiftScale / 2;
    
    fillCircle( context, -width * shiftScale / 2, -height * shiftScale / 2, 5, "blue" );
    
    context.setTransform( 1, 0, 0, 1, xShift, yShift );
    fillCircle( context, 0, 0, 5, "red" );
    
    var x = 0;
    var y = 0;
    context.beginPath();
    context.moveTo( x, y );
    for( var i = 0; i < this._lines.length; i++ )
    {
        var shift = DragonCurve.Shift[ this._lines[ i ] ];
        x += shift.x * shiftScale;
        y += shift.y * shiftScale;
        context.lineTo( x, y );
    }
    context.stroke();
};

var fractalsCreators = { };
fractalsCreators[ "Tree" ] = function()
{
    var lineWidth = Number( lineWidthInput.value );
    var depth = Number( depthInput.value );
    var angleScale = getAngleScale();

    fractal = new TreeFractal( lineWidth, depth, angleScale );
    render();
};
fractalsCreators[ "Dragon Curve" ] = function()
{
    var lineWidth = Number( lineWidthInput.value );
    var depth = Number( depthInput.value );

    fractal = new DragonCurve( lineWidth, depth );
    render();
};

function generateFractal()
{
    fractalsCreators[ typeSelect.value ]();
}


/* Input */

typeSelect.addEventListener( "change", function()
{
    //setFractal( typeSelect.value );
} );

drawButton.addEventListener( "click", function()
{
    if( display.allValid() )
    {
        $( ".modal" ).modal( "hide" );

        generateFractal();
    }
} );

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

function getAngleScale()
{
    var str = angleScaleInput.value;
    var strSplit = str.split( "/" );
    if( strSplit.length === 1 )
    {
        return Number( strSplit[ 0 ] );
    }
    else
    {
        return Number( strSplit[ 0 ] ) / Number( strSplit[ 1 ] );
    }
}


/* Animation */

function update( elapsedTime )
{
}


/* Render */

function render()
{
    clear( context );

    if( fractal )
    {
        fractal.draw();
    }
}


/* Main */

( function()
{
    generateFractal();
    onWindowResize();
    setupDisplayValidators();
} )();
