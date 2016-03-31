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

function* CycleSort()
{
    for( var cycleStart = 0; cycleStart < itemCount; cycleStart++ )
    {
        var item = items[ cycleStart ];

        var pos = cycleStart;
        for( var i = cycleStart + 1; i < itemCount; i++ )
        {
            if( items[ i ] < item )
            {
                pos++;
            }
        }

        while( pos != cycleStart )
        {
            pos = cycleStart;
            for( var i = cycleStart + 1; i < itemCount; i++ )
            {
                if( items[ i ] < item )
                {
                    pos++;
                }
            }
            while( item == items[ pos ] )
            {
                pos++;
            }
            var temp = item;
            item = items[ pos ];
            items[ pos ] = temp;
            yield;
        }
    }
}

function* DualPivotQuickSort()
{
    function* _sort( lo, hi )
    {
        if( hi <= lo )
        {
            return;
        }

        if( items[ hi ] < items[ lo ] )
        {
            swap( hi, lo );
            yield;
        }

        var lt = lo + 1;
        var gt = hi - 1;
        var i = lo + 1;
        while( i <= gt )
        {
            if( items[ i ] < items[ lo ] )
            {
                swap( lt, i );
                lt++;
                i++;
                yield;
            }
            else if( items[ hi ] < items[ i ] )
            {
                swap( i, gt );
                gt--;
                yield;
            }
            else
            {
                i++;
            }
        }
        lt--;
        gt++;
        swap( lo, lt );
        yield;
        swap( hi, gt );
        yield;

        yield* _sort( lo, lt - 1 );
        if( items[ lt ] < items[ gt ] )
        {
            yield* _sort( lt + 1, gt - 1 );
        }
        yield* _sort( gt + 1, hi );
    }

    yield* _sort( 0, itemCount - 1 );
}

function* GnomeSort()
{
    var index = 1;
    while( index < itemCount )
    {
        if( items[ index ] > items[ index - 1 ] )
        {
            index++;
        }
        else
        {
            swap( index, index - 1 );
            if( index > 1 )
            {
                index--;
            }
            yield;
        }
    }
}

function* HeapSort()
{
    function* _heapify()
    {
        var start = Math.floor( ( itemCount - 2 ) / 2 );
        while( start >= 0 )
        {
            yield* _siftDown( start, itemCount - 1 );
            start--;
        }
    }

    function * _siftDown( start, end )
    {
        var root = start;

        while( root * 2 + 1 <= end )
        {
            var child = root * 2 + 1;
            var swapIndex = root;
            if( items[ swapIndex ] < items[ child ] )
            {
                swapIndex = child;
            }
            if( child + 1 < end && items[ swapIndex ] < items[ child + 1 ] )
            {
                swapIndex = child + 1;
            }
            if( swapIndex == root )
            {
                return;
            }
            else
            {
                swap( root, swapIndex );
                root = swapIndex;
                yield;
            }
        }
    }

    yield* _heapify();

    var end = itemCount - 1;
    while( end > 0 )
    {
        swap( end, 0 );
        yield;
        end--;
        yield* _siftDown( 0, end );
    }
}

function* MergeSort()
{
    function* _sort( start, length )
    {
        if( length <= 1 )
        {
            return;
        }
        var leftStart = start;
        var leftLength = Math.floor( length / 2 );
        var rightStart = leftStart + leftLength;
        var rightLength = length - leftLength;
        yield* _sort( leftStart, leftLength );
        yield* _sort( rightStart, rightLength );
        yield* _merge( leftStart, rightStart, start + length );
    }

    function* _merge( leftStart, rightStart, end )
    {
        var leftIndex = leftStart;
        var rightIndex = rightStart;
        while( leftIndex < rightIndex && rightIndex < end )
        {
            if( items[ leftIndex ] < items[ rightIndex ] )
            {
                leftIndex++;
            }
            else
            {
                var temp = items[ rightIndex ];
                for( var i = rightIndex; i > leftIndex; i-- )
                {
                    swap( i, i - 1 );
                    yield;
                }
                items[ leftIndex ] = temp;
                leftIndex++;
                rightIndex++;
                yield;
            }
        }
    }

    yield* _sort( 0, itemCount );
}

function* OddEvenSort()
{
    var done = false;
    while( !done )
    {
        done = true;
        for( var i = 1; i < itemCount - 1; i += 2 )
        {
            if( items[ i ] > items[ i + 1 ] )
            {
                swap( i, i + 1 );
                done = false;
                yield;
            }
        }
        for( var i = 0; i < itemCount - 1; i += 2 )
        {
            if( items[ i ] > items[ i + 1 ] )
            {
                swap( i, i + 1 );
                done = false;
                yield;
            }
        }
    }
}

function* QuickSort()
{
    function* _sort( low, high )
    {
        if( low < high )
        {
            var partionGenerator = _partition( low, high );
            var ret;
            do
            {
                ret = partionGenerator.next();
                yield;
            }
            while( !ret.done );
            var storeIndex = ret.value;
            yield* _sort( low, storeIndex - 1 );
            yield* _sort( storeIndex + 1, high );
        }
    }

    function* _partition( low, high )
    {
        var pivotIndex = Math.floor( ( high + low ) / 2 );
        var pivotValue = items[ pivotIndex ];
        swap( pivotIndex, high );
        yield;
        var storeIndex = low;
        for( var i = low; i < high; i++ )
        {
            if( items[ i ] < pivotValue )
            {
                swap( i, storeIndex );
                yield;
                storeIndex++;
            }
        }
        swap( storeIndex, high );
        return storeIndex;
    }

    yield* _sort( 0, itemCount - 1 );
}

function* SelectionSort()
{
    for( var i = 0; i < itemCount; i++ )
    {
        var minIndex = i;
        for( var j = i + 1; j < itemCount; j++ )
        {
            if( items[ j ] < items[ minIndex ] )
            {
                minIndex = j;
            }
        }
        if( minIndex != i )
        {
            swap( i, minIndex );
            yield;
        }
    }
}

function* SeveralUniqueSorter()
{
    var endIndex = itemCount - 1;
    var pos;
    var highValue;
    var swapIndex = 0;
    var newValue;

    do
    {
        highValue = 0;
        pos = -1;
        while( pos < endIndex )
        {
            pos++;
            newValue = items[ pos ];
            if( newValue < highValue )
            {
                items[ swapIndex ] = newValue;
                yield;
                swapIndex++;
                items[ pos ] = highValue;
                yield;
            }
            else if( newValue > highValue )
            {
                swapIndex = pos;
                highValue = items[ pos ];
            }
        }
        endIndex = swapIndex - 1;
    }
    while( pos >= swapIndex );
}

function* ShellSort()
{
    var GAPS = [ 701, 301, 132, 57, 23, 10, 4, 1 ];

    for( var g = 0; g < GAPS.length; g++ )
    {
        var gap = GAPS[ g ];
        for( var i = gap; i < itemCount; i++ )
        {
            var temp = items[ i ];
            var j;
            for( j = i; j >= gap && items[ j - gap ] > temp; j -= gap )
            {
                items[ j ] = items[ j - gap ];
                yield;
            }
            items[ j ] = temp;
            yield;
        }
    }
}

function* StoogeSort()
{
    function* _sort( lo, hi )
    {
        if( items[ hi ] < items[ lo ] )
        {
            swap( hi, lo );
            yield;
        }

        if( hi - lo + 1 > 2 )
        {
            var third = Math.floor( ( hi - lo + 1 ) / 3 );
            yield* _sort( lo, hi - third );
            yield* _sort( lo + third, hi );
            yield* _sort( lo, hi - third );
        }
    }

    yield* _sort( 0, itemCount - 1 );
}

function* ThreeWayQuickSort()
{
    function* _sort( lo, hi )
    {
        if( hi <= lo )
        {
            return;
        }

        var lt = lo;
        var gt = hi;
        var i = lo + 1;
        var pivotIndex = lo;
        var pivotValue = items[ lo ];

        while( i <= gt )
        {
            if( items[ i ] < pivotValue )
            {
                swap( i, lt );
                i++;
                lt++;
                yield;
            }
            else if( items[ i ] > pivotValue )
            {
                swap( i, gt );
                gt--;
                yield;
            }
            else
            {
                i++;
            }
        }

        yield* _sort( lo, lt - 1 );
        yield* _sort( gt + 1, hi );
    }

    yield* _sort( 0, itemCount - 1 );
}

function* MSDRadixSort()
{
    function* _sort( start, end, digit )
    {
        if( digit == 0 )
        {
            return;
        }
        var counter = [ [ ], [ ], [ ], [ ], [ ], [ ], [ ], [ ], [ ], [ ] ];

        for( var j = start; j < end; j++ )
        {
            var bucket = _getDigit( items[ j ], digit );
            counter[ bucket ].push( items[ j ] );
        }
        var pos = start;
        for( var j = 0; j < counter.length; j++ )
        {
            var newStart = pos;
            while( counter[ j ].length != 0 )
            {
                items[ pos ] = counter[ j ][ 0 ];
                pos++;
                counter[ j ].shift();
                yield;
            }
            yield* _sort( newStart, pos, digit - 1 );
        }
    }

    function _getDigit( num, place )
    {
        var dev;
        var mod;

        switch( place )
        {
            case 1:
                mod = 10;
                dev = 1;
                break;

            case 2:
                mod = 100;
                dev = 10;
                break;

            case 3:
                mod = 1000;
                dev = 100;
                break;

            case 4:
                mod = 10000;
                dev = 1000;
                break;

            case 5:
                mod = 100000;
                dev = 10000;
                break;

            case 6:
                mod = 1000000;
                dev = 100000;
                break;

            case 7:
                mod = 10000000;
                dev = 1000000;
                break;

            case 8:
                mod = 100000000;
                dev = 10000000;
                break;

            case 9:
                mod = 1000000000;
                dev = 100000000;
                break;

            default:
                dev = 10 ^ ( place - 1 );
                mod = dev * 10;
                break;
        }

        return Math.floor( Math.floor( num % mod ) / dev );
    }

    yield* _sort( 0, itemCount, Math.max.apply( Math, items ).toString().length );
}

function* LSDRadixSort()
{
    function _getDigit( num, place )
    {
        var dev;
        var mod;

        switch( place )
        {
            case 1:
                mod = 10;
                dev = 1;
                break;

            case 2:
                mod = 100;
                dev = 10;
                break;

            case 3:
                mod = 1000;
                dev = 100;
                break;

            case 4:
                mod = 10000;
                dev = 1000;
                break;

            case 5:
                mod = 100000;
                dev = 10000;
                break;

            case 6:
                mod = 1000000;
                dev = 100000;
                break;

            case 7:
                mod = 10000000;
                dev = 1000000;
                break;

            case 8:
                mod = 100000000;
                dev = 10000000;
                break;

            case 9:
                mod = 1000000000;
                dev = 100000000;
                break;

            default:
                dev = 10 ^ ( place - 1 );
                mod = dev * 10;
                break;
        }

        return Math.floor( Math.floor( num % mod ) / dev );
    }

    var counter = [ [ ], [ ], [ ], [ ], [ ], [ ], [ ], [ ], [ ], [ ] ];

    var maxDigitSymbols = Math.max.apply( Math, items ).toString().length;
    for( var i = 1; i <= maxDigitSymbols; i++ )
    {
        for( var j = 0; j < itemCount; j++ )
        {
            var bucket = _getDigit( items[ j ], i );
            counter[ bucket ].push( items[ j ] );
        }
        var pos = 0;
        for( j = 0; j < counter.length; j++ )
        {
            while( counter[ j ].length != 0 )
            {
                items[ pos ] = counter[ j ][ 0 ];
                pos++;
                counter[ j ].shift();
                yield;
            }
        }
    }
}

var sortingAlgorithms = {
    "Bitonic Sort" : BitonicSort,
    "Bubble Sort" : BubbleSort,
    "Cocktail Shaker Sort" : CocktailSort,
    "Comb Sort" : CombSort,
    "Cycle Sort" : CycleSort,
    "Dual-Pivot Quick Sort" : DualPivotQuickSort,
    "Gnome Sort" : GnomeSort,
    "Heap Sort" : HeapSort,
    "Insertion Sort" : InsertionSort,
    "In-Place MSD Radix Sort" : InPlaceMSDRadixSort,
    "LSD Radix Sort" : LSDRadixSort,
    "Merge Sort" : MergeSort,
    "MSD Radix Sort" : MSDRadixSort,
    "Odd Even Sort" : OddEvenSort,
    "Quick Sort" : QuickSort,
    "RandoSort" : RandomSort,
    "Selection Sort" : SelectionSort,
    "Several Unique Sort" : SeveralUniqueSorter,
    "Shell Sort" : ShellSort,
    "Stooge Sort" : StoogeSort,
    "Three-Way Quick Sort" : ThreeWayQuickSort
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
                    console.log( "Done" );
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
