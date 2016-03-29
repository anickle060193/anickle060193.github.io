/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var algorithmSelect = document.getElementById( "algorithm" );

var itemCountInput = document.getElementById( "item_count" );
var iterationDelayInput = document.getElementById( "iteration_delay" );
var changesPerIterationInput = document.getElementById( "changes_per_iteration" );

var sortButton = document.getElementById( "sort" );
var randomButton = document.getElementById( "random" );

function onWindowResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    context.setTransform( 1, 0, 0, -1, 0, canvas.height | 0 );
    context.translate( 0.5, 0.5 )

    render();
}

onDebouncedWindowResize( onWindowResize );

$( '[ data-toggle="popover" ]' ).popover();

/* Validation */

var display = new ValidationGroup();

function setupDisplayValidators()
{
    display.addValidator( itemCountInput, function( input )
    {
        var itemCount = getItemCount();
        return isFinite( itemCount ) && itemCount >= 2;
    } );
    display.addValidator( iterationDelayInput, function( input )
    {
        var iterationDelay = getIterationDelay();
        return isFinite( iterationDelay ) && iterationDelay >= 0;
    } );
    display.addValidator( changesPerIterationInput, function( input )
    {
        var changesPerIteration = getChangesPerIteration();
        return isFinite( changesPerIteration ) && changesPerIteration > 0;
    } );
}


/* Sorting */

function swap( i, j )
{
    var temp = items[ i ];
    items[ i ] = items[ j ];
    items[ j ] = temp;
}

function sorted()
{
    for( var i = 0; i < itemCount - 1; i++ )
    {
        if( items[ i ] > items[ i + 1 ] )
        {
            return false;
        }
    }
    return true;
}

function BubbleSort()
{
    this.lastIndex = 0;
    this.sortIteration = function()
    {
        var i = this.lastIndex;
        var j = this.lastIndex + 1;
        if( items[ i ] > items[ j ] )
        {
            swap( i, j );
        }
        this.lastIndex = ( this.lastIndex + 1 ) % ( itemCount - 1 );
    };
    this.done = function()
    {
        return sorted();
    };
}

function CocktailSort()
{
    this.lastIndex = 0;
    this.direction = 1;
    this.sortIteration = function()
    {
        var i = this.lastIndex;
    };
}

var sortingAlgorithms = {
    "Bubble" : new BubbleSort()
};

var sorter = null;
var itemCount = 0;
var items = [ ];
var itemColors = [ ]

function setSort()
{
    sorter = sortingAlgorithms[ algorithmSelect.value ];
    initializeItems();
    randomizeItems();

    iterationDelay = getIterationDelay() / 1000;
    changesPerIteration = getChangesPerIteration();
    sorting = true;
}

function initializeItems()
{
    itemCount = getItemCount();
    items = [ ];
    itemColors = [ ];
    for( var i = 0; i < itemCount; i++ )
    {
        items.push( i );
        itemColors.push( HSVtoRGB( i / itemCount, 0.85, 0.85 ) );
    }
}

function randomizeItems()
{
    items.shuffle();
    render();
}

function sortIteration()
{
    if( sorter )
    {
        sorter.sortIteration();
        if( sorter.done() )
        {
            console.log( "Done" );
            sorting = false;
        }
    }
}


/* Input */

function getItemCount()
{
    return Number( itemCountInput.value );
}

function getIterationDelay()
{
    return Number( iterationDelayInput.value );
}

function getChangesPerIteration()
{
    return Number( changesPerIterationInput.value );
}

sortButton.addEventListener( "click", function()
{
    if( display.allValid() )
    {
        $( ".modal" ).modal( "hide" );

        setSort();
    }
} );

randomButton.addEventListener( "click", function()
{
    randomizeItems();
    render();
} );


/* Animation */

var sorting = false;
var iterationDelay = 0
var changesPerIteration = 20;

var totalTime = 0;

function update( elapsedTime )
{
    if( sorting )
    {
        if( totalTime > iterationDelay )
        {
            for( var i = 0; i < changesPerIteration && sorting; i++ )
            {
                sortIteration();
            }
            render();
            totalTime = 0;
        }
        else
        {
            totalTime += elapsedTime;
        }
    }
}


/* Render */

function render()
{
    clear( context );

    var itemWidth = canvas.width / itemCount;
    var x = 0;
    for( var i = 0; i < itemCount; i++ )
    {
        var ratio = ( items[ i ] + 1 ) / itemCount
        context.fillStyle = itemColors[ items[ i ] ];
        context.fillRect( x, 0, itemWidth, ratio * canvas.height );
        x += itemWidth;
    }
}


/* Main */

( function()
{
    onWindowResize();
    setupDisplayValidators();
    initializeItems();
    render();

    startAnimation( update, function() { } );
} )();
