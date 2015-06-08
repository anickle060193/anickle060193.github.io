/* Document Elements */

var mainContent = document.getElementById( "mainContent" );

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

function onWindowResize()
{
    canvas.width = mainContent.clientWidth;
    canvas.height = mainContent.clientHeight;
}

onDebouncedWindowResize( onWindowResize );
onWindowResize();


/* Color */

function Color( a, r, g, b )
{
    this.r = r !== undefined ? r : Math.floor( random( 255 ) );
    this.g = g !== undefined ? g : Math.floor( random( 255 ) );
    this.b = b !== undefined ? b : Math.floor( random( 255 ) );
    this.a = a !== undefined ? a : 255;

    this.RGB = function()
    {
        return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
    };
    this.RGBA = function()
    {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    };
}

/* Explosions */

var explosions = [ ];

var maxSpeed = 256;

var maxRadius = 35;
var minRadius = 20;

var minExplosionRadiusIncrease = 20;
var maxExplosionRadiusIncrease = 50;

var minExplosionRate = 150;
var maxExplosionRate = 256;

var state_normal = 0;
var state_exploding = 1;
var state_afterExploding = 2;
var state_disappearing = 3;
var state_gone = 4;

var defaultAfterExplodingDelay = 3.0;
var explosionShadowOffset = 1;

function Explosion()
{
    this.x = random( canvas.width );
    this.y = random( canvas.height );
    this.radius = random( minRadius, maxRadius );
    this.maxExplosionRadius = this.radius + random( minExplosionRadiusIncrease, maxExplosionRadiusIncrease );
    this.explosionRate = random( minExplosionRate, maxExplosionRate );
    this.xSpeed = random( -maxSpeed, maxSpeed );
    this.ySpeed = random( -maxSpeed, maxSpeed );
    this.color = new Color( 150 );
    this.state = state_normal;
    this.afterExplodingDelay = defaultAfterExplodingDelay;

    this.checkBounds = function()
    {
        if( this.x - this.radius < 0 )
        {
            this.x = this.radius + 1;
            this.xSpeed = -this.xSpeed;
        }
        else if( this.x + this.radius >= canvas.width )
        {
            this.x = canvas.width - this.radius - 1;
            this.xSpeed = -this.xSpeed;
        }
        if( this.y - this.radius < 0 )
        {
            this.y = this.radius + 1;
            this.ySpeed = -this.ySpeed;
        }
        else if( this.y + this.radius >= canvas.height )
        {
            this.y = canvas.height - this.radius - 1;
            this.ySpeed = -this.ySpeed;
        }
    };
    this.update = function( elapsedTime )
    {
        if( this.state == state_normal )
        {
            this.x += this.xSpeed * elapsedTime;
            this.y += this.ySpeed * elapsedTime;
            this.checkBounds();
        }
        else if( this.state == state_exploding )
        {
            this.radius += this.explosionRate * elapsedTime;
            if( this.radius >= this.maxExplosionRadius )
            {
                this.radius = this.maxExplosionRadius;
                this.state = state_afterExploding;
            }
        }
        else if( this.state == state_afterExploding )
        {
            this.afterExplodingDelay -= elapsedTime;
            if( this.afterExplodingDelay <= 0 )
            {
                this.afterExplodingDelay = 0;
                this.state = state_disappearing;
            }
        }
        else if( this.state == state_disappearing )
        {
            this.radius -= this.explosionRate * elapsedTime;
            if( this.radius <= 0 )
            {
                this.radius = 0;
                this.state = state_gone;
            }
        }
    };
    this.paint = function()
    {
        if( this.state != state_gone )
        {
            fillCircle( context, this.x + explosionShadowOffset, this.y + explosionShadowOffset, this.radius, this.color.RGBA() );
            fillCircle( context, this.x, this.y, this.radius, this.color.RGB() );
        }
    };
    this.intersectsPoint = function( x, y )
    {
        var xDiff = x - this.x;
        var yDiff = y - this.y;
        var dist = Math.sqrt( xDiff * xDiff + yDiff * yDiff );
        return dist <= this.radius;
    };
    this.explode = function()
    {
        if( this.state == state_normal )
        {
            this.state = state_exploding;
            this.xSpeed = 0;
            this.ySpeed = 0;
        }
    };
    this.isTouching = function( explosion )
    {
        var xDiff = explosion.x - this.x;
        var yDiff = explosion.y - this.y;
        var dist = Math.sqrt( xDiff * xDiff + yDiff * yDiff );
        return dist <= ( explosion.radius + this.radius );
    };
    this.canExplode = function()
    {
        return this.state == state_normal;
    };
    this.canCauseExplosion = function()
    {
        return this.state == state_exploding
            || this.state == state_afterExploding
            || this.state == state_disappearing;
    };
    this.propagateExplosion = function( causalExplosion )
    {
        if( this.canExplode()
         && causalExplosion.canCauseExplosion()
         && this.isTouching( causalExplosion ) )
        {
            this.explode();
        }
    };
}

function addRandomExplosion()
{
    var explosion = new Explosion();
    explosions.unshift( explosion );
    return explosion;
}

function updateExplosions( elapsedTime )
{
    for( var i = 0; i < explosions.length; i++ )
    {
        explosions[ i ].update( elapsedTime );
    }
    explosions = explosions.filter( function( explosion )
    {
        return explosion.state != state_gone;
    } );
    for( var i = 0; i < explosions.length; i++ )
    {
        var causalExplosion = explosions[ i ];
        for( var j = 0; j < explosions.length; j++ )
        {
            if( i != j )
            {
                explosions[ j ].propagateExplosion( causalExplosion );
            }
        }
    }
}

function paintExplosions()
{
    for( var i = explosions.length - 1; i >= 0; i-- )
    {
        explosions[ i ].paint();
    }
}


/* Rendering */

function render()
{
    clear( context );
    paintExplosions();
}


/* Input Handler */

function createTouchExplosion( x, y )
{
    var explosion = addRandomExplosion();
    explosion.x = x;
    explosion.y = y;
    explosion.explode();
}

function createMultipleExplosions()
{
    for( var i = 0; i < 20; i++ )
    {
        addRandomExplosion();
    }
}

canvas.addEventListener( "touchstart", function( e )
{
    if( e.touches.length == 1 )
    {
        var x = e.touches[ 0 ].clientX - canvas.offsetLeft;
        var y = e.touches[ 0 ].clientY - canvas.offsetTop;
        createTouchExplosion( x, y );
    }
    else if( e.touches.length == 2 )
    {
        createMultipleExplosions();
    }
} );

canvas.addEventListener( "click", function( e )
{
    var x = e.x - canvas.offsetLeft;
    var y = e.y - canvas.offsetTop;
    createTouchExplosion( x, y );
} );

function getChar( event )
{
	if( event.which == null )
	{
		return String.fromCharCode( event.keyCode );
	}
	else if( event.which != 0 && event.charCode != 0 )
	{
		return String.fromCharCode( event.which );
	}
	else
	{
		return null;
	}
}

addEventListener( "keypress", function( e )
{
    var char = getChar( e );
    if( char == "e" )
    {
        createMultipleExplosions();
    }
} );


/* Main */

createMultipleExplosions();

startAnimation( updateExplosions, render );
