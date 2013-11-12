
/// Server event handlers
/// Begin

function OnOpen()
{
    g_server.m_start = true;
    g_webSocket.send( JSON.stringify( { type : 'login_get', login : 'undefined' } ) );
    InfLog( 'Send request for get login.' );
}

function OnClose()
{
    InfLog( 'Close connection.' );
}

function OnError( a_error )
{
    if ( a_error.data === undefined )
        ErrLog( 'Cann\'t connect to server.' );
    else
        ErrLog( a_error.data );
}

function OnMessage( a_msg )
{
    a_msg = JSON.parse( a_msg.data );
    var ans = {};

    switch ( a_msg.type )
    {
        case 'login' :
            InfLog( '[RECV]: Get login: ' + a_msg.login );
            g_world.m_player.m_id = a_msg.login;
            ans = { type : 'login_ack' };
            break;

        case 'update' :
            InfLog( '[RECV]: Get update for tick ' + a_msg.tick );
            g_world.Update( a_msg, (new Date()).getTime() );
            ans = { type : 'update_ack', tick : a_msg.tick };
            break;

        default :
            ErrLog( '[RECV]: Non-existent command: ' + a_msg.tick );
    }

    g_webSocket.send( JSON.stringify( ans ) );
}

/// Server event handlers
/// End

/// Client input handlers
/// Begin

function OnKeyDown( a_event )
{
    if ( !g_server.m_start )
        return;

    events = a_event || window.event;

    g_server.m_downKeys[ event.keyCode ] = true;
}

function OnKeyUp( a_event )
{
     if ( !g_server.m_start )
        return;

    events = a_event || window.event;

    g_server.m_downKeys[ event.keyCode ] = false;
}

function OnMouseMove( a_event )
{
    if ( !g_server.m_start )
        return;

    var mouseX = a_event.pageX - canvas.offsetLeft;
    var mouseY = canvas.height - ( a_event.pageY - canvas.offsetTop );

    g_server.m_mouseMove        = true;
    g_server.m_mouseLastPos.m_x = mouseX;
    g_server.m_mouseLastPos.m_y = mouseY;
}

function ProcessUserControl ()
{
    var shiftValue = { m_x : 0.0, m_y : 0.0 };

    //d
    if ( g_server.m_downKeys[ 68 ] )
        ++shiftValue.m_x;

    //a
    if ( g_server.m_downKeys[ 65 ] )
        --shiftValue.m_x;

    //w
    if ( g_server.m_downKeys[ 87 ] )
        ++shiftValue.m_y;

    //s
    if ( g_server.m_downKeys[ 83 ] )
        --shiftValue.m_y;

    g_world.ProcessUserInput( shiftValue, g_server.m_mouseLastPos );

    g_server.m_controlVec.m_x += shiftValue.m_x;
    g_server.m_controlVec.m_y += shiftValue.m_y;

    g_cursor.SetPos( g_server.m_mouseLastPos );
    document.getElementById( "mouse_pos" ).innerHTML = "Mouse pos: (" + g_server.m_mouseLastPos.m_x + ", " + g_server.m_mouseLastPos.m_y + ")";
}

/// Client input handlers
/// End

function OnLoad()
{
	canvas = document.getElementById( 'game-canvas' );

    canvas.onmousemove = OnMouseMove;

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

    g_server = new GameServer();
    g_cursor = new Cursor( g_server.m_mouseLastPos );
    g_world  = new World();
    setInterval( NextState, 10 );
}

function StartGame()
{
    g_webSocket = new WebSocket( 'ws://localhost:1024' );

    if ( g_webSocket === undefined )
        alert( 'WebSockets not supported' );

    g_webSocket.onopen      = OnOpen;
    g_webSocket.onclose     = OnClose;
    g_webSocket.onmessage   = OnMessage;
    g_webSocket.onerror     = OnError;

    setInterval( NextState, 20 );
}

function NextState()
{
    if ( !g_server.m_start )
        return;

    ProcessUserControl();
    g_world.Draw();
    g_cursor.Draw();
}

function GameServer ()
{
    this.m_controlVec   = { m_x : 0.0, m_y : 0.0 };
    this.m_start        = false;
    this.m_downKeys     = {};
    this.m_mouseLastPos = { m_x : 0, m_y : canvas.height};
}
