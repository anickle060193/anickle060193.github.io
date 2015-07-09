if( false )
{
    var div = document.getElementById( "testingPanel" );
    div.parentNode.removeChild( div );
}

function isPrime( num )
{
    var sqrt = Math.sqrt( num );
    for( var i = 2; i <= sqrt; i++ )
    {
        if( num % i === 0 )
        {
            return false;
        }
    }
    return num !== 1;
}

var state_right = new State( 0, 1 );
var state_up = new State( -1, 0 );
var state_left = new State( 0, -1 );
var state_down = new State( 1, 0 );

state_right.next = state_up;
state_up.next = state_left;
state_left.next = state_down;
state_down.next = state_right;

function State( vInc, hInc )
{
    this.increment = { v: vInc, h: hInc };
    this.next = null;

    this.updateStep = function( grid, row, col )
    {
        var r = row + this.next.increment.v;
        var c = col + this.next.increment.h;
        if( grid.get( r, c ) === invalid )
        {
            return this.next;
        }
        else
        {
            return this;
        }
    };
}

var invalid = -1;

function Grid()
{
    this.rings = 1;

    this._offset = Math.floor( Math.pow( 2, 31 ) );
    this._grid = [ ];
    this._r = 0;
    this._c = 1;
    this._state = state_up;
    this._pow = 1;

    this.set( 0, 0, 1 );
}
Grid.prototype.get = function( row, col )
{
    row += this._offset;
    col += this._offset;
    if( this._grid[ row ] === undefined )
    {
        return -1;
    }
    else if( this._grid[ row ][ col ] === undefined )
    {
        return -1;
    }
    else
    {
        return this._grid[ row ][ col ];
    }
};
Grid.prototype.set = function( row, col, value )
{
    row += this._offset;
    col += this._offset;
    if( this._grid[ row ] === undefined )
    {
        this._grid[ row ] = [ ];
    }
    this._grid[ row ][ col ] = value;
};
Grid.prototype.addRing = function()
{
    var i = this._pow * this._pow + 1;
    this._pow += 2;
    var max = this._pow * this._pow;
    while( i <= max )
    {
        this.set( this._r, this._c, i );
        this._r += this._state.increment.v;
        this._c += this._state.increment.h;

        this._state = this._state.updateStep( this, this._r, this._c );
        i++;
    }
    this.rings++;
};

var grid = new Grid();

function getPercentage()
{
    for( var i = grid.rings; i++ )
    {

    }
}
