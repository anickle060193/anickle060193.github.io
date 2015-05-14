/* Document Elements */

var mainContent = document.getElementById( "mainContent" );

var canvas = document.getElementById( "canvas" );
var ctx = canvas.getContext( "2d" );
ctx.translate( 0.5, 0.5 );

var line = new Line();

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

function onWindowResize()
{
	canvas.width = mainContent.clientWidth;
	canvas.height = mainContent.clientHeight;
	update();
}

window.addEventListener( "resize", debounce( onWindowResize, 250 ) );
onWindowResize();

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

function generateRandomColor()
{
	return "#" + Math.round( Math.random() * 0xFFFFFF ).toString( 16 );
}

function getWidth()
{
	return canvas.width;
}

function getHeight()
{
	return canvas.height;
}

var intervalVar = null;

function addRandomPoint()
{
	var x = Math.random() * getWidth();
	var y = Math.random() * getHeight();
	var p = new Point( x, y ).convertFromWindow();
	line.addPoint( p );

	update();
}

function onKeyPress( event )
{
	var char = getChar( event );
	if( char == "c" )
	{
		line = new Line();
		update();
	}
	else if( char == "r" )
	{
		if( intervalVar == null )
		{
			intervalVar = setInterval( addRandomPoint, 20 );
		}
		else
		{
			clearInterval( intervalVar );
			intervalVar = null;
		}
	}
}

window.addEventListener( "keypress", onKeyPress );

function Midpoint( p1, p2 )
{
	var x = ( p1.x + p2.x ) / 2;
	var y = ( p1.y + p2.y ) / 2;
	return new Point( x, y );
}

function Point( x, y )
{
	this.x = x;
	this.y = y;
	this.convertToWindow = function()
	{
		var x = this.x * getWidth();
		var y = this.y * getHeight();
		return new Point( x, y );
	};
	this.convertFromWindow = function()
	{
		var	x = this.x / getWidth();
		var y = this.y / getHeight();
		return new Point( x, y );
	};
}

function Line()
{
	this.points = [ ];
	this.childLine = null;
	this.color = generateRandomColor();
	this.addPoint = function( point )
	{
		this.points.push( point );
		if( this.points.length >= 2 )
		{
			if( this.childLine == null )
			{
				this.childLine = new Line();
			}
			var p1 = this.points[ this.points.length - 1 ];
			var p2 = this.points[ this.points.length - 2 ];
			this.childLine.addPoint( Midpoint( p1, p2 ) );
		}
		if( this.points.length > 100 )
		{
			this.removeFirstPoint();
		}
	};
	this.removeFirstPoint = function()
	{
		if( this.points.length > 0 )
		{
			this.points.splice( 0, 1 );
			if( this.childLine != null )
			{
				this.childLine.removeFirstPoint();
			}
		}
	};
	this.drawLine = function()
	{
		ctx.beginPath();
		if( this.points.length > 0 )
		{
			var start = this.points[ 0 ].convertToWindow();
			ctx.moveTo( start.x, start.y );
		}
		for( var i = 0; i < this.points.length; i++ )
		{
			var p = this.points[ i ].convertToWindow();
			ctx.lineTo( p.x, p.y );
		}
		ctx.strokeStyle = this.color;
		ctx.stroke();
		if( this.childLine != null )
		{
			this.childLine.drawLine();
		}
	};
	this.lineCount = function()
	{
		return 1 + ( this.childLine != null ? this.childLine.lineCount() : 0 );
	};
	this.pointCount = function()
	{
		return this.points.length + ( this.childLine != null ? this.childLine.pointCount() : 0 );
	};
}

canvas.addEventListener( "click", function( e )
{
    var x = e.x - canvas.offsetLeft;
    var y = e.y - canvas.offsetTop;
	line.addPoint( new Point( x, y ).convertFromWindow() );
	update();
} );

function update()
{
	ctx.clearRect( 0, 0, getWidth(), getHeight() );

	line.drawLine();
}
