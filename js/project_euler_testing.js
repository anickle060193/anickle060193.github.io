if( true )
{
    var div = document.getElementById( "testingPanel" );
    div.parentNode.removeChild( div );
}

var gridSize = 2;

var nodes = { };

function Location( x, y )
{
    this.x = x;
    this.y = y;
}
Location.prototype.toString = function()
{
    return "( " + this.x + ", " + this.y + " )";
};

function Node( data, down, right )
{
    this.data = data;
    this.down = null;
    this.right = null;
    nodes[ this.data.toString() ] = this;
}

function setChildren( node )
{
    if( node.data.x < gridSize )
    {
        var rightData = new Location( node.data.x + 1, node.data.y );
        if( nodes[ rightData.toString() ] !== undefined )
        {
            node.right = nodes[ rightData.toString() ];
        }
        else
        {
            node.right = new Node( rightData, null, null );
            setChildren( node.right );
        }
    }

    if( node.data.y < gridSize )
    {
        var downData = new Location( node.data.x, node.data.y + 1 );
        if( nodes[ downData.toString() ] !== undefined )
        {
            node.down = nodes[ downData.toString() ];
        }
        else
        {
            node.down = new Node( downData, null, null );
            setChildren( node.down );
        }
    }
}

var root = new Node( new Location( 0, 0 ), null, null );
setChildren( root );

var paths = 0;
var end = nodes[ new Location( 2, 2 ).toString() ];
for( var data in nodes )
{
    var node = nodes[ data ];
    if( node.right == end || node.down == end )
    {
        paths++;
    }
}

console.log( nodes );
