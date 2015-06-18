/* Utility Classes */

function Point( x, y )
{
    this.x = x;
    this.y = y;
}


/* Resizing */

// By David Walsh: http://davidwalsh.name/javascript-debounce-function
function debounce( func, wait, immediate )
{
	var timeout;
	return function()
    {
		var context = this, args = arguments;
		var later = function()
        {
			timeout = null;
			if( !immediate )
            {
                func.apply( context, args );
            }
		};
		var callNow = immediate && !timeout;
		clearTimeout( timeout );
		timeout = setTimeout( later, wait );
		if( callNow )
        {
            func.apply( context, args );
        }
	};
}

var resizeTimer;
function onDebouncedWindowResize( onWindowResize, delay )
{
    if( delay === undefined )
    {
        delay = 250;
    }
    window.addEventListener( "resize", debounce( onWindowResize, delay, false ) );
}


/* Animation */

( function()
{
    var lastTime = 0;
    var vendors = [ 'webkit', 'moz' ];
    for( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x )
    {
        window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
        window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ]
                                   || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
    }
    if( !window.requestAnimationFrame )
    {
        window.requestAnimationFrame = function( callback )
        {
            var currTime = new Date().getTime();
            var timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
            var id = window.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if( !window.cancelAnimationFrame )
        window.cancelAnimationFrame = function( id )
        {
            clearTimeout( id );
        };
}() );

var animator = {
    lastTime: 0,
    renderer: function() { },
    updater: function() { }
};
function animate( time )
{
    var elapsedTime = time - animator.lastTime;
    animator.lastTime = time;
    animator.renderer();
    if( 0 < elapsedTime && elapsedTime < 100 )
    {
        animator.updater( elapsedTime / 1000 );
    }
    window.requestAnimationFrame( animate );
}

function startAnimation( updater, renderer )
{
    animator.lastTime = new Date().getTime();
    animator.renderer = renderer;
    animator.updater = updater;
    animate( new Date().getTime() );
}


/* Rendering */

function clear( context )
{
    context.save();

    context.setTransform( 1, 0, 0, 1, 0, 0 );
    context.clearRect( 0, 0, canvas.width, canvas.height );

    context.restore();
}


/* Utility Functions */

function getRelativeCoordinates( e )
{
    var x = 0;
    var y = 0;
    
    if( e.offsetX !== undefined && e.offsetY !== undefined )
    {
        x = e.offsetX;
        y = e.offsetY;
    }
    else if( e.layerX !== undefined && e.layerY !== undefined )
    {
        x = e.layerX;
        y = e.layerY;
    }
    else
    {
        var totalOffsetX = 0;
        var totalOffsetY = 0;
        var currentElement = e.currentElement || e.srcElement || e.target;

        do
        {
            totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
            totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
        }
        while( currentElement = currentElement.offsetParent )

        x = event.pageX - totalOffsetX;
        y = event.pageY - totalOffsetY;
    }
    return { x: x, y: y };
}

function random( x, y )
{
    if( y === undefined )
    {
        return Math.random() * x;
    }
    else
    {
        return random( y - x ) + x;
    }
}

function randomAbsoluteColor()
{
    var r = Math.floor( random( 256 ) );
    var g = Math.floor( random( 256 ) );
    var b = Math.floor( random( 256 ) );
    return "rgb(" + r + "," + g + "," + b + ")";
}

function HSVtoRGB( h, s, v )
{
    var r, g, b, i, f, p, q, t;
    if( h === undefined )
    {
        h = 1.0;
    }
    if( s === undefined )
    {
        s = 1.0;
    }
    if( v === undefined )
    {
        v = 1.0;
    }
    i = Math.floor( h * 6 );
    f = h * 6 - i;
    p = v * ( 1 - s );
    q = v * ( 1 - f * s );
    t = v * ( 1 - ( 1 - f ) * s );
    switch( i % 6 )
    {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    r = Math.floor( r * 255 );
    g = Math.floor( g * 255 );
    b = Math.floor( b * 255 );
    return "rgb( " + r + "," + g + "," + b + ")";
}

var goldenRatioConjugate = 0.618033988749895;
var h = Math.random();
function randomDistributedColor()
{
    h += goldenRatioConjugate;
    h %= 1;
    return HSVtoRGB( h, 0.85, 0.75 );
}

function distance( p1, p2 )
{
    var xDiff = p1.x - p2.x;
    var yDiff = p1.y - p2.y;
    return Math.sqrt( xDiff * xDiff + yDiff * yDiff );
}

function removeAllWhiteSpace( text )
{
    return text.replace( /\s*/g, "" );
}

function validHexColorString( color )
{
    return /^#[0-9a-f]{6}$/i.exec( removeAllWhiteSpace( color ) );
}


/* Drawing */

function fillCircle( context, centerX, centerY, radius, fillStyle )
{
    context.beginPath();
    context.arc( centerX, centerY, radius, 0, 2 * Math.PI, false );
    context.fillStyle = fillStyle;
    context.fill();
}

function drawLines( context, points, strokeStyle )
{
    if( points.length > 1 )
    {
        context.strokeStyle = strokeStyle;
        context.beginPath();
        var p = points[ 0 ];
        context.moveTo( p.x, p.y );
        for( var i = 1; i < points.length; i++ )
        {
            var point = points[ i ];
            context.lineTo( point.x, point.y );
        }
        context.stroke();
    }
}


/* Canvas Manipulations */

// Courtesy of http://phrogz.net/tmp/canvas_zoom_to_cursor.html
function trackTransforms( ctx )
{
	var svg = document.createElementNS( "http://www.w3.org/2000/svg", "svg" );
	var xform = svg.createSVGMatrix();
	ctx.getTransform = function()
    {
        return xform;
    };
	
	var savedTransforms = [ ];
	var save = ctx.save;
	ctx.save = function()
    {
		savedTransforms.push( xform.translate( 0, 0 ) );
		return save.call( ctx );
	};
	var restore = ctx.restore;
	ctx.restore = function()
    {
		xform = savedTransforms.pop();
		return restore.call( ctx );
	};

	var scale = ctx.scale;
	ctx.scale = function( sx, sy )
    {
		xform = xform.scaleNonUniform( sx, sy );
		return scale.call( ctx, sx, sy) ;
	};
	var rotate = ctx.rotate;
	ctx.rotate = function( radians )
    {
		xform = xform.rotate( radians * 180 / Math.PI );
		return rotate.call( ctx, radians );
	};
	var translate = ctx.translate;
	ctx.translate = function( dx,dy )
    {
		xform = xform.translate( dx, dy );
		return translate.call( ctx, dx, dy );
	};
	var transform = ctx.transform;
	ctx.transform = function( a, b, c, d, e, f )
    {
		var m2 = svg.createSVGMatrix();
		m2.a=a;
        m2.b=b;
        m2.c=c;
        m2.d=d;
        m2.e=e;
        m2.f=f;
		xform = xform.multiply( m2 );
		return transform.call( ctx, a, b, c, d, e, f );
	};
	var setTransform = ctx.setTransform;
	ctx.setTransform = function( a, b, c, d, e, f )
    {
		xform.a = a;
		xform.b = b;
		xform.c = c;
		xform.d = d;
		xform.e = e;
		xform.f = f;
		return setTransform.call( ctx, a, b, c, d, e, f );
	};
	var pt  = svg.createSVGPoint();
	ctx.transformedPoint = function( x, y )
    {
		pt.x=x;
        pt.y=y;
		return pt.matrixTransform( xform.inverse() );
	};
}

var scaleFactor = 1.5;
function zoom( clicks )
{
    var p = context.transformedPoint( lastX, lastY );
    context.translate( p.x, p.y );
    var factor = Math.pow( scaleFactor, clicks );
    context.scale( factor, factor );
    context.translate( -p.x, -p.y );
}


/* Input Validation */

function Validator( input, inputGroup, validatorFunction )
{
    this.input = input;
    this.inputGroup = inputGroup;
    this.valid = function()
    {
        return validatorFunction( this.input );
    };
    this.onInput = ( function( validator )
    {
        return function()
        {
            validation.updateValidity( validator );
        };
    } )( this );
}

var validation = 
{
    validators : { },
    updateValidity: function( validator )
    {
        if( validator.valid() )
        {
            validator.inputGroup.classList.remove( "has-error" );
        }
        else
        {
            validator.inputGroup.classList.add( "has-error" );
        }
    },
    addValidater: function( input, inputGroup, validatorFunction )
    {
        var validator = new Validator( input, inputGroup, validatorFunction );
        this.removeValidator( validator.input );
        this.validators[ validator.input.id ] = validator;
        input.addEventListener( "input", validator.onInput );
        this.updateValidity( validator );
    },
    removeValidator: function( input )
    {
        var validator = this.validators[ input.id ];
        if( validator !== undefined )
        {
            validator.input.removeEventListener( "input", validator.onInput );
            delete this.validators[ input.id ];
        }
    },
    allValid: function()
    {
        for( var key in this.validators )
        {
            if( !this.validators[ key ].valid() )
            {
                return false;
            }
        }
        return true;
    }
};