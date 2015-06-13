/* Includes */

/// <reference path="utilities.js" />


/* Document Elements */

var segmentsInput = document.getElementById( "segmentsInput");
segmentsInput.value = 128;
var smoothnessInput = document.getElementById( "smoothnessInput" );
smoothnessInput.value = 0.8;
var delayInput = document.getElementById( "delayInput" );
delayInput.value = 10;
var processButton = document.getElementById( "processButton" );

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );
context.translate( 0.5, 0.5 );

function onWindowResize()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    render();
}
onWindowResize();

onDebouncedWindowResize( onWindowResize );


/* Input Handling */

function validateNumberInput( e, allowDecimal )
{
    var charCode = e.which ? e.which : e.keyCode;
    return ( allowDecimal && charCode == ".".charCodeAt() )
        || ( "0".charCodeAt() <= charCode
          && "9".charCodeAt() >= charCode );
}

segmentsInput.onkeypress = function( e )
{
    return validateNumberInput( e, false );
};
smoothnessInput.onkeypress = function( e )
{
    return validateNumberInput( e, true );
};
delayInput.onkeypress = function( e )
{
    return validateNumberInput( e, true );
};

segmentsInput.onchange = function( e )
{
    var value = Number( segmentsInput.value );
    if( !isNaN( value ) )
    {
        segmentsInput.value = nextPowerOfTwo( value );
    }
};

processButton.onclick = function()
{
    var segments = Number( segmentsInput.value );
    if( isNaN( segments ) || segments <= 0 || segments > 10000 )
    {
        alert( "Segments must be a valid number between 1 and 10,000 inclusively." );
        return;
    }

    var smoothness = Number( smoothnessInput.value );
    if( isNaN( smoothness ) || smoothness < 0 || smoothness > 1 )
    {
        alert( "Segments must be a valid number between 0 and 1 inclusively." );
        return;
    }

    var delay = Number( delayInput.value );
    if( isNaN( delay ) || delay < 1 || delay > 10000 )
    {
        alert( "Segments must be a valid number between 1 and 10,000 inclusively." );
        return;
    }

    createLine( Math.floor( segments ), smoothness, delay );
};


/* Utilities */

function isPowerOfTwo( num )
{
    return ( num != 0 ) && ( ( num & ( num - 1 ) ) == 0 );
}

function bound( value, min, max )
{
    if( value < min )
    {
        return min;
    }
    else if( value > max )
    {
        return max;
    }
    else
    {
        return value;
    }
}

function nextPowerOfTwo( val )
{
    var p2 = 2;
    while( p2 < val )
    {
        p2 *= 2;
    }
    return p2;
}

/* Line */

function Line( length, smoothness )
{
    this.heightMap = [ ];
    this.toProcess = [ ];
    this.color = randomAbsoluteColor();
    this.smoothness = bound( smoothness, 0, 1 );

    length = isPowerOfTwo( length ) ? length : nextPowerOfTwo( length );
    for( var i = 0; i < length; i++ )
    {
        this.heightMap.push( 0 );
    }

    var left = Math.random();
    var right = Math.random();
    this.heightMap[ 0 ] = left;
    this.heightMap[ length - 1 ] = right;
    this.min = Math.min( left, right );
    this.max = Math.max( left, right );

    this.addToProcess = function( low, high, smoothness )
    {
        this.toProcess.push( { low: low, high: high, smoothness: smoothness } );
    };

    this.addToProcess( 0, length - 1, this.smoothness );

    this.process = function()
    {
        if( this.toProcess.length > 0 )
        {
            var next = this.toProcess.shift();
            var low = next.low;
            var high = next.high;
            var offset = next.smoothness;
            var midpoint = Math.floor( ( low + high ) / 2 );

            var height = ( this.heightMap[ low ] + this.heightMap[ high ] ) / 2;
            height += random( -offset, offset );
            this.heightMap[ midpoint ] = height;
            this.min = Math.min( this.min, height );
            this.max = Math.max( this.max, height );

            if( high - midpoint > 1 )
            {
                var newSmoothness = offset / Math.pow( 2, this.smoothness );
                this.addToProcess( low, midpoint, newSmoothness );
                this.addToProcess( midpoint, high, newSmoothness );
            }
        }
    };

    this.doneProcessing = function()
    {
        return this.toProcess.length == 0;
    };

    this.normalizeHeight = function( height )
    {
        return ( height - this.min ) / ( this.max - this.min );
    };

    this.drawLine = function()
    {
        if( this.heightMap.length > 0 )
        {
            context.strokeStyle = this.color;
            context.lineWidth = lineWidth;
            context.beginPath();

            var xSpacing = canvas.width / ( this.heightMap.length - 1 );
            var halfHeight = canvas.height * 0.5;

            var x = 0;
            for( var i = 0; i < this.heightMap.length; i++ )
            {
                var y = this.normalizeHeight( this.heightMap[ i ] );
                y = ( y + 0.5 ) * halfHeight;

                if( i == 0 )
                {
                    context.moveTo( x, y );
                }
                else
                {
                    context.lineTo( x, y );
                }
                x += xSpacing;
            }
            context.stroke();
        }
    };
}



/* Rendering */

var lineWidth = 2;

function render()
{
    clear( context );
    if( line !== undefined )
    {
        line.drawLine();
    }
    else
    {
        context.strokeStyle = randomAbsoluteColor();
        context.lineWidth = lineWidth;
        context.beginPath();
        context.moveTo( 0, canvas.height / 2 );
        context.lineTo( canvas.width, canvas.height / 2 );
        context.stroke();
    }
}


/* Main */

var line;

var processInterval;

function createLine( segments, smoothness, updateDelay )
{
    line = new Line( segments, smoothness );
    clearInterval( processInterval );
    processInterval = setInterval( function()
    {
        line.process();
        if( line.doneProcessing() )
        {
            clearInterval( processInterval );
        }
        render();
    }, updateDelay );
}

render();
