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

function Triangle( a, b, c )
{
    this.a = a;
    this.b = b;
    this.c = c;
}
Triangle.prototype.divide = function()
{
    var ab = new Point( ( this.a.x + this.b.x ) / 2, ( this.a.y + this.b.y ) / 2 );
    var ac = new Point( ( this.a.x + this.c.x ) / 2, ( this.a.y + this.c.y ) / 2 );
    var bc = new Point( ( this.b.x + this.c.x ) / 2, ( this.b.y + this.c.y ) / 2 );
    return [
        new Triangle( this.a, ab, ac ),
        new Triangle( ab, this.b, bc ),
        new Triangle( ac, bc, this.c )
    ];
};

function SierpinskiTriangle( color, iterations )
{
    Fractal.call( this, color, 0 );

    this.iterations = Math.min( iterations, 9 );
    this.triangles = null;
    this.reset();
}
SierpinskiTriangle.prototype = Object.create( Fractal.prototype );
SierpinskiTriangle.prototype.drawTriangle = function( tri, scale )
{
    if( this.rainbow )
    {
        var x = ( tri.a.x + tri.b.x + tri.c.x ) / 3;
        var y = ( tri.a.y + tri.b.y + tri.c.y ) / 3;
        var dist = Math.sqrt( x * x + y * y );
        context.fillStyle = HSVtoRGB( dist, 0.85, 0.85 );
    }
    context.beginPath();
    context.moveTo( tri.a.x * scale, tri.a.y * scale );
    context.lineTo( tri.b.x * scale, tri.b.y * scale );
    context.lineTo( tri.c.x * scale, tri.c.y * scale );
    context.fill();
};
SierpinskiTriangle.prototype.draw = function()
{
    if( !this.rainbow )
    {
        context.fillStyle = this.color;
    }
    var size = Math.min( canvas.width, canvas.height ) * 0.98;
    for( var i = 0; i < this.triangles.length; i++ )
    {
        this.drawTriangle( this.triangles[ i ], size );
    }
};
SierpinskiTriangle.prototype.reset = function()
{
    var side = 1;
    var height = Math.sqrt( 3 ) / 2 * side;
    var a = new Point( 0, -height / 2 );
    var b = new Point( -side / 2 , height / 2 );
    var c = new Point(  side / 2 , height / 2 );
    this.triangles = [ new Triangle( a, b, c ) ];

    this.currentIteration = 0;
};
SierpinskiTriangle.prototype.generateStep = function()
{
    if( this.currentIteration < this.iterations )
    {
        this.currentIteration++;
        var triangles = [ ];
        for( var i = 0; i < this.triangles.length; i++ )
        {
            var ret = this.triangles[ i ].divide();
            triangles.push.apply( triangles, ret );
        }
        this.triangles = triangles;
        return true;
    }
    return false;
};

function MandelbrotSet( iterations )
{
    Fractal.call( this, "black", 0 );

    this.iterations = iterations * 10;
}
MandelbrotSet.prototype = Object.create( Fractal.prototype );
MandelbrotSet.prototype.reset = function()
{
    this.currentStep = 0;
};
MandelbrotSet.prototype.draw = function()
{
    function mandelIter( cx, cy, maxIter )
    {
        var x = 0;
        var y = 0;
        var xx = 0;
        var yy = 0;
        var xy = 0;

        var i = maxIter;
        while( i-- && xx + yy <= 4 )
        {
            xy = x * y;
            xx = x * x;
            yy = y * y;
            x = xx - yy + cx;
            y = xy + xy + cy;
        }
        return maxIter - i;
    }

    var width = Math.min( canvas.width, canvas.height );
    var height = width * 2 / 3;

    var xmin = -2;
    var xmax = 1;
    var ymin = -1;
    var ymax = 1;

    var img = context.getImageData( 0, 0, width, height );
    var pix = img.data;

    for( var ix = 0; ix < width; ix++ )
    {
        for( var iy = 0; iy < height; iy++ )
        {
            var x = xmin + ( xmax - xmin ) * ix / ( width - 1 );
            var y = ymin + ( ymax - ymin ) * iy / ( height - 1 );
            var i = mandelIter( x, y, this.iterations );
            var ppos = 4 * ( width * iy + ix );

            if( i > this.iterations )
            {
                pix[ ppos ] = 0;
                pix[ ppos + 1 ] = 0;
                pix[ ppos + 2 ] = 0;
            }
            else
            {
                var c = 3 * Math.log( i ) / Math.log( this.iterations - 1 );
                if( c < 1 )
                {
                    pix[ ppos ] = 255 * c;
                    pix[ ppos + 1 ] = 0;
                    pix[ ppos + 2 ] = 0;
                }
                else if( c < 2 )
                {
                    pix[ ppos ] = 255;
                    pix[ ppos + 1 ] = 255 * ( c - 1 );
                    pix[ ppos + 2 ] = 0;
                }
                else
                {
                    pix[ ppos ] = 255;
                    pix[ ppos + 1 ] = 255;
                    pix[ ppos + 2 ] = 255 * ( c - 2 );
                }
            }
            pix[ ppos + 3 ] = 255;
        }
    }
    context.save();
    context.setTransform( 1, 0, 0, 1, 0, 0 );
    context.fillRect( 0, 0, canvas.width, canvas.height, "black" );
    context.restore();
    context.putImageData( img, ( canvas.width - width ) / 2, ( canvas.height - height ) / 2 );
};
MandelbrotSet.prototype.generateStep = function()
{

};

var fractalsCreators = { };
fractalsCreators[ "Tree" ] = function()
{
    var color = getColor();
    var lineWidth = Number( lineWidthInput.value );
    var depth = Number( depthInput.value );
    var angleScale = getAngleScale();

    fractal = new TreeFractal( color, lineWidth, depth, angleScale );
};
fractalsCreators[ "Dragon Curve" ] = function()
{
    var color = getColor();
    var lineWidth = Number( lineWidthInput.value );
    var depth = Number( depthInput.value );

    fractal = new DragonCurve( color, lineWidth, depth );
};
fractalsCreators[ "Sierpinski Triangle" ] = function()
{
    var color = getColor();
    var iterations = Number( depthInput.value );

    fractal = new SierpinskiTriangle( color, iterations );
};
fractalsCreators[ "Mandelbrot Set" ] = function()
{
    var iterations = Number( depthInput.value );

    fractal = new MandelbrotSet( iterations );
};

function generateFractal()
{
    fractalsCreators[ typeSelect.value ]();
    render();
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
    if( fractal )
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
    onWindowResize();
    setupDisplayValidators();

    startAnimation( update );

    generateFractal();
} )();
