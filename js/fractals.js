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

var redrawButton = document.getElementById( "redraw" );
var delayFactorInput = document.getElementById( "delayFactor" );

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

function Fractal( color, lineWidth )
{
    this.color = color;
    this.rainbow = this.color === "rainbow";
    this.lineWidth = lineWidth;
}
Fractal.prototype.draw = function() { };
Fractal.prototype.generateStep = function()
{
    return false;
};
Fractal.prototype.reset = function() { };

function TreeFractal( color, lineWidth, depth, angleScale )
{
    Fractal.call( this, color, lineWidth );

    this.depth = depth;
    this.angleScale = angleScale;
    
    this._maxY = 0;
    this._maxX = 0;

    this._lines = [ ];
    this.reset();
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
TreeFractal.prototype.generateStep = function()
{
    if( this._currentStep > 1 )
    {
        this._currentStep--;
        return true;
    }
    return false;
};
TreeFractal.prototype.reset = function()
{
    this._currentStep = this.depth + 1;
};
TreeFractal.prototype.drawLine = function( line, color, lineWidth )
{
    context.strokeStyle = this.rainbow ? color : this.color;
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
    for( var i = this._currentStep; i <= this.depth; i++ )
    {
        var color = HSVtoRGB( i / this.depth, 0.85, 0.85 );
        for( var j = 0; j < this._lines[ i ].length; j++ )
        {
            this.drawLine( this._lines[ i ][ j ], color, this.lineWidth );
        }
    }
};

function DragonCurve( color, lineWidth, iterations )
{
    Fractal.call( this, color, lineWidth );
    
    this.iterations = iterations;
    
    if( this.rainbow )
    {
        this.color = 0;
        this.colorStep = 1 / Math.pow( 2, this.iterations );
    }
    this.reset();
}
DragonCurve.prototype = Object.create( Fractal.prototype );
DragonCurve.matrix = {
    mult: function( m, v )
    {
        return [ m[ 0 ][ 0 ] * v[ 0 ] + m[ 0 ][ 1 ] * v[ 1 ], m[ 1 ][ 0 ] * v[ 0 ] + m[ 1 ][ 1 ] * v[ 1 ] ];
    },
    minus: function( a, b )
    {
        return [ a[ 0 ] - b[ 0 ], a[ 1 ] - b[ 1 ] ];
    },
    plus: function( a, b )
    {
        return [ a[ 0 ] + b[ 0 ], a[ 1 ] + b[ 1 ] ];
    }
};
DragonCurve.Left = [ [ 1/2,-1/2 ], 
                     [ 1/2, 1/2 ] ];
DragonCurve.Right = [ [ 1/2, 1/2 ],
                      [-1/2, 1/2 ] ];
DragonCurve.growNewPoint = function( a, c, lr )
{
    var diff = DragonCurve.matrix.minus( c, a );
    var directionMatrix = lr ? DragonCurve.Left : DragonCurve.Right;
    var product = DragonCurve.matrix.mult( directionMatrix, diff )
    return DragonCurve.matrix.plus( a, product );
};
DragonCurve.prototype.reset = function()
{
    this.currentStep = 0;
};
DragonCurve.prototype.generateStep = function()
{
    if( this.currentStep < this.iterations )
    {
        this.currentStep++;
        this.colorStep = 1 / Math.pow( 2, this.currentStep );
        return true;
    }
    return false;
};
DragonCurve.prototype._draw = function( a, c, depth, lr )
{
    if( depth === 0 )
    {
        if( this.rainbow )
        {
            context.strokeStyle = HSVtoRGB( this.color, 0.85, 0.85 );
            this.color += this.colorStep;
        }
        context.beginPath();
        context.moveTo( a[ 0 ], a[ 1 ] );
        context.lineTo( c[ 0 ], c[ 1 ] );
        context.stroke();
    }
    else
    {
        var b = DragonCurve.growNewPoint( a, c, lr, depth );
        
        this._draw( b, a, depth - 1, lr );
        this._draw( b, c, depth - 1, lr );
    }
};
DragonCurve.prototype.draw = function()
{   
    var width = canvas.width;
    var height = canvas.height;
    
    var size = Math.min( height, width / 1.5 ) * 0.9;
    
    var x1 = -size * ( 0.75 - 1 / 6 );
    var x2 = size * ( 0.75 - 1 / 3 );
    var y = height * 2 / 3 + -height / 2;
 
    context.lineWidth = this.lineWidth;
    if( !this.rainbow )
    {
        context.strokeStyle = this.color;
    }
    this._draw( [ x1, y ], [ x2, y ], this.currentStep, false );
};

var fractalsCreators = { };
fractalsCreators[ "Tree" ] = function()
{
    var color = getColor();
    var lineWidth = Number( lineWidthInput.value );
    var depth = Number( depthInput.value );
    var angleScale = getAngleScale();

    fractal = new TreeFractal( color, lineWidth, depth, angleScale );
    render();
};
fractalsCreators[ "Dragon Curve" ] = function()
{
    var color = getColor();
    var lineWidth = Number( lineWidthInput.value );
    var depth = Number( depthInput.value );

    fractal = new DragonCurve( color, lineWidth, depth );
    render();
};

function generateFractal()
{
    fractalsCreators[ typeSelect.value ]();
}


/* Input */

function startDrawing()
{
    fractal.reset();
    t = 0;
    render();
}

redrawButton.addEventListener( "click", function()
{
    startDrawing();
} );

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
        startDrawing();
    }
} );

delayFactorInput.addEventListener( "change", function()
{
    var num = Number( delayFactorInput.value );
    if( isFinite( num ) && num > 0 )
    {
        delay = num;
    }
} );

function getColor()
{
    var color = removeAllWhiteSpace( colorInput.value.toString() );
    if( validHexColorString( color ) )
    {
        return color;
    }
    else if( color.toLowerCase() === "rainbow" )
    {
        return "rainbow";
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

var delay = 0.5;
var t = 0;

function update( elapsedTime )
{
    t += elapsedTime;
    if( t >= delay )
    {
        if( fractal.generateStep() )
        {
            render();
        }
        t = 0;
    }
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
    
    startAnimation( update );
} )();
