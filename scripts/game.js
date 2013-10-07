function InitWorld()
{
    userCharacter = new Character( new Vector( 100.0, 100.0 ), new Vector( 0.0, 0.0 ) );
}

function DrawWorld()
{
    userCharacter.Draw();
}

function DrawScene()
{
    gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );

    DrawWorld();
}

function OnKeyDown( a_event )
{
    events = a_event || window.event;

    var shiftValue = { m_x : 0.0, m_y : 0.0 };

    switch ( event.keyCode )
    {

        case 68 : //d
            shiftValue.m_x = 1.0;
            break;
        case 65 : //a
            shiftValue.m_x = -1.0;
            break;
        case 87 : //w
            shiftValue.m_y = 1.0;
            break;
        case 83 : //s
            shiftValue.m_y = -1.0;
            break;
        default :
            break;
    }

    userCharacter.ShiftOn( shiftValue );
}

function StartGame()
{
	canvas = document.getElementById( 'game-canvas' );

	if ( !canvas )
		alert( '[Error]: Can\'t find canvas element on page!' );

	try
	{
        gl = canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' );

		if ( !gl )
			alert( '[Error]: Can\'t retrieve webgl context!' );
	}
	catch( excp )
	{
		alert( '[Excep]: On retriving webgl context!' );	
	}

	if ( gl )
	{
		gl.viewportWidth  = canvas.width;
		gl.viewportHeight = canvas.height;

		InitShaders();
        InitWorld();

        setInterval( DrawScene, 10 );
	}
}