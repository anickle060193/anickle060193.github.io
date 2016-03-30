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

function addSortingAlgorithms()
{
    for( var algorithmName in sortingAlgorithms )
    {
        var opt = document.createElement( "option" );
        opt.innerHTML = algorithmName;
        algorithmSelect.appendChild( opt );
    }
}

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
    for( var i = 0; i < itemCount; i++ )
    {
        if( i != items[ i ] )
        {
            return false;
        }
    }
    return true;
}

function* BubbleSort()
{
    var changed;
    do
    {
        changed = false;
        for( var i = 0; i < itemCount - 1; i++ )
        {
            if( items[ i ] > items[ i + 1 ] )
            {
                swap( i, i + 1 );
                changed = true;
                yield;
            }
        }
    }
    while( changed );
}

function* CocktailSort()
{
    var changed;
    do
    {
        changed = false;
        for( var i = 0; i < itemCount - 1; i++ )
        {
            if( items[ i ] > items[ i + 1 ] )
            {
                swap( i, i + 1 );
                changed = true;
                yield;
            }
        }
        if( !changed )
        {
            break;
        }
        for( var i = itemCount - 1; i >= 1; i-- )
        {
            if( items[ i - 1 ] > items[ i ] )
            {
                swap( i - 1, i );
                yield;
            }
        }
    }
    while( changed );
}

function* RandomSort()
{
    while( !sorted() )
    {
        items.shuffle();
        yield;
    }
}

function* InsertionSort()
{
    for( var i = 1; i < itemCount; i++ )
    {
        var temp = items[ i ];
        var j = 0;
        for( j = i; j > 0; j-- )
        {
            if( items[ j - 1 ] < temp )
            {
                break;
            }
            items[ j ] = items[ j - 1 ];
            yield;
        }
        items[ j ] = temp;
        yield;
    }
}

function* CombSort()
{
    var gap = itemCount;
    var shrink = 1.3;
    var swapped = false;
    while( gap != 1 || swapped )
    {
        gap = Math.floor( gap / shrink );
        if( gap < 1 )
        {
            gap = 1;
        }
        swapped = false;
        for( var i = 0; i + gap < itemCount; i++ )
        {
            if( items[ i ] > items[ i + gap ] )
            {
                swap( i, i + gap );
                swapped = true;
                yield;
            }
        }
    }
}

function* InPlaceMSDRadixSort()
{
    function _getBit( num, bit )
    {
        return ( num & ( 1 << ( bit - 1 ) ) ) != 0 ? 1 : 0;
    }

    function* _sort( start, end, bit )
    {
        if( bit == 0 || ( end - start ) == 0 )
        {
            return;
        }

        var bin0 = start - 1;
        var bin1 = end;
        while( bin0 + 1 < bin1 )
        {
            var bin = _getBit( items[ bin0 + 1 ], bit );
            if( bin == 1 )
            {
                swap( bin0 + 1, bin1 - 1 );
                bin1--;
                yield;
            }
            else
            {
                bin0++;
            }
        }
        yield* _sort( start, bin0 + 1, bit - 1 );
        yield* _sort( bin1, end, bit - 1 );
    }
    yield* _sort( 0, itemCount, 64 );
}

function* BitonicSort()
{
    function* _sort( lo, n, ascending )
    {
        if( n > 1 )
        {
            var k = Math.floor( n / 2 );
            yield* _sort( lo, k, true );
            yield* _sort( lo + k, k, false );

            yield* _merge( lo, n, ascending );
        }
    }

    function* _merge( lo, n, ascending )
    {
        if( n > 1 )
        {
            var k = Math.floor( n / 2 );
            for( var i = lo; i < lo + k; i++ )
            {
                yield* _compare( i, i + k, ascending );
            }
            yield* _merge( lo, k, ascending );
            yield* _merge( lo + k, k, ascending );
        }
    }

    function* _compare( i, j, ascending )
    {
        if( ascending == ( items[ i ] > items[ j ] ) )
        {
            swap( i, j );
            yield;
        }
    }

    yield* _sort( 0, itemCount, true );
}

var sortingAlgorithms = {
    "Bubble Sort" : BubbleSort,
    "Cocktail Shaker Sort" : CocktailSort,
    "RandoSort" : RandomSort,
    "Insertion Sort" : InsertionSort,
    "Comb Sort" : CombSort,
    "In-Place MSD Radix Sort" : InPlaceMSDRadixSort,
    "Bitonic Sort" : BitonicSort
};

var sorter = null;
var itemCount = 0;
var items = [ ];
var itemColors = [ ]

function setSort()
{
    var sorterName = algorithmSelect.value
    sorter = sortingAlgorithms[ sorterName ]();

    if( sorterName == "Bitonic Sort" )
    {
        itemCountInput.value = Math.pow( 2, Math.ceil( Math.log( itemCount ) / Math.log( 2 ) ) );
    }

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
            for( var i = 0; i < changesPerIteration; i++ )
            {
                if( sorter.next().done )
                {
                    sorting = false;
                    break;
                }
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
    addSortingAlgorithms();
    setupDisplayValidators();
    initializeItems();
    render();

    startAnimation( update, function() { } );
} )();
