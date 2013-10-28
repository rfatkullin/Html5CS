function OnMessage( a_message )
{ 
    InfLog( '[RECV]: ' + a_message.data );
    var json = JSON.parse( a_message.data );

    if ( json.type === 'login' ) 
    { 
        InfLog( 'Get login: ' + json.data );
        g_gameState.login = json.data;
    }
    else
        alert( 'Other data.' );
}

function InitWorld()
{
    g_gameState = { start : false, login : undefined };

    g_userCharacter = new Character( new Vector( 100.0, 100.0 ), new Vector( 0.0, 0.0 ) );
}

function DrawWorld()
{
    g_userCharacter.Draw();
}

function DrawScene()
{
    gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );

    DrawWorld();
}

function SendKeyDown( a_key )
{
    g_webSocket.send( JSON.stringify( { type : 'control', login: g_gameState.login, key : a_key } ) );
    InfLog( 'Send control key' );
}

function OnKeyDown( a_event )
{    
    if ( !g_gameState || !g_gameState.start )
        return;

    events = a_event || window.event;

    var shiftValue = { m_x : 0.0, m_y : 0.0 };

    switch ( event.keyCode )
    {

        case 68 : //d
            SendKeyDown( 68 );
            shiftValue.m_x = 1.0;
            break;
        case 65 : //a
            SendKeyDown( 65 );
            shiftValue.m_x = -1.0;
            break;
        case 87 : //w
            SendKeyDown( 87 );
            shiftValue.m_y = 1.0;
            break;
        case 83 : //s
            SendKeyDown( 83 );
            shiftValue.m_y = -1.0;
            break;
        default :
            break;
    }

    g_userCharacter.ShiftOn( shiftValue );
}

function OnLoad()
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
		alert( '[Exc]: On retriving webgl context!' );	
	}

	if ( gl )
	{
		gl.viewportWidth  = canvas.width;
		gl.viewportHeight = canvas.height;

		InitShaders();        
	}
}

function OnOpen()
{
    console.log( '[INF]: Socket is open.' );
    g_webSocket.send( JSON.stringify( { type : 'login', login : 'undefined' } ) );    
}

function StartGame()
{
    g_webSocket = new WebSocket( 'ws://localhost:1024' );

    if ( g_webSocket === undefined )
        alert( 'WebSockets not supported' );

    g_webSocket.onopen      = OnOpen;
    g_webSocket.onclose     = function( a_event )   { /*Empty*/ };
    g_webSocket.onmessage   = OnMessage;
    g_webSocket.onerror     = function ( a_error )  { alert( 'Error message: ' + a_error.message ); };
    
    InitWorld();    

    g_gameState.start = true;

    setInterval( NextState, 10 );
}

function NextState()
{
    if ( !g_gameState.login )
        return;

    DrawWorld();
}

function InfLog( a_msg )
{
    console.log( new Date() + '[INF]: ' + a_msg );
}

function ErrLog( a_msg )
{
    console.log( new Date() + '[ERR]: ' + a_msg );  
}