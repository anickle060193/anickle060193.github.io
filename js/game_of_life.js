/* Includes */

/// <reference path="utilities.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var widthInput = document.getElementById( "width" );
var widthGroup = document.getElementById( "widthGroup" );
var heightInput = document.getElementById( "height" );
var heightGroup = document.getElementById( "heightGroup" );
var versionSelect = document.getElementById( "version" );
var updateButton = document.getElementById( "update" );
var bornCheckboxes = [ ];
var stayAliveCheckboxes = [ ];

for( var i = 1; i <= 9; i++ )
{
    bornCheckboxes[ i ] = document.getElementById( "b" + i.toString() );
    stayAliveCheckboxes[ i ] = document.getElementById( "s" + i.toString() );
}

$( ".collapse" ).collapse();

function setNumbersState( version )
{
    if( version.custom )
    {
        $( "#numbersCollapse" ).collapse( "show" );
        for( var i = 1; i <= 9; i++ )
        {
            bornCheckboxes[ i ].disabled = version.custom != true;
            bornCheckboxes[ i ].checked = bornNumbers[ i ];
            stayAliveCheckboxes[ i ].disabled = version.custom != true;
            stayAliveCheckboxes[ i ].checked = stayAiveNumbers[ i ];
        }
    }
    else
    {
        $( "#numbersCollapse" ).collapse( "hide" );
    }
}

versionSelect.addEventListener( "input", function()
{
    setNumbersState( versionSelect.value == "Custom" );
} );

updateButton.addEventListener( "click", function()
{
    if( validation.allValid() )
    {
        $( "#controlsModal" ).modal( "hide" );
        cellWidth = Number( widthInput.value );
        cellHeight = Number( heightInput.value );
    }
} );


/* Validators */

validation.addValidater( widthInput, widthGroup, function( input )
{
    var num = Number( input.value );
    return isFinite( num ) && 0 < num;
} );

validation.addValidater( heightInput, heightGroup, function( input )
{
    var num = Number( input.value );
    return isFinite( num ) && 0 < num;
} );


/* Variables */

var cellWidth = 20;
var cellHeight = 20;
var bornNumbers = [ ];
var stayAiveNumbers = [ ];

var version = {
	"Standard (B3/S23)": new Version( "B2/S23" ),
	"Highlife (B36/S23)": new Version( "B36/S23" ),
	"Sierpinkski (B1/S12)": new Version( "B1/S12" ),
	"Seeds (B2/S)": new Version( "B2/S" ),
	"Custom": new Version( "B/S", true )
};

function Version( versionString, custom )
{
    this.born = [ ];
    this.stayAlive = [ ];
    this.custom = custom == true;

    this.nextState = function( neighbors )
    {
        return this.born[ neighbors ] == true || this.stayAlive[ neighbors ] == true;
    };

    versionString = removeAllWhiteSpace( versionString );
    var matches = versionString.match( /^[Bb](\d*)\// );
    if( matches && matches.length == 2 )
    {
        var nums = matches[ 1 ];
        for( var i = 0; i < nums.length; i++ )
        {
            this.born[ Number( nums[ i ] ) ] = true;
        }
    }
    matches = versionString.match( /[Ss](\d*)$/ );
    if( matches && matches.length == 2 )
    {
        var nums = matches[ 1 ];
        for( var i = 0; i < nums.length; i++ )
        {
            this.stayAlive[ Number( nums[ i ] ) ] = true;
        }
    }
}

function updateNumbers()
{
    bornNumbers = [ ];
    stayAliveNumbers = [ ];
    for( var i = 1; i <= 9; i++ )
    {
        bornNumbers[ i ] = bornCheckboxes[ i ].checked;
        stayAiveNumbers[ i ] = stayAliveCheckboxes[ i ].checked;
    }
}

/* Main */
( function()
{
    updateNumbers();
    setNumbersState( false );
} )();
