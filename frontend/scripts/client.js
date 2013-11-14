
/// Server event handlers
/// Begin

function OnOpen()
{
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
            g_client.m_start = true;
            //setInterval( ShiftPlayer, 20 );
            ans = { type : 'login_ack' };
            break;

        case 'update' :
            //InfLog( '[RECV]: Get update for tick ' + a_msg.tick );
            g_world.Update( a_msg, (new Date()).getTime() );
            ans = { type : 'update_ack', tick : a_msg.tick };
            break;

        default :
            ErrLog( '[RECV]: Non-existent command: ' + a_msg.tick );
    }

    g_webSocket.send( JSON.stringify( ans ) );
}

function ShiftPlayer()
{
    g_client.m_shiftVec.m_x += 2;
    g_shiftRTPlayer.m_x += 2;
}

/// Server event handlers
/// End

/// Client input handlers
/// Begin

function OnKeyDown( a_event )
{
    if ( !g_client.m_start )
        return;

    var ev = a_event || window.event;

    g_client.m_downKeys[ ev.keyCode ] = true;
}

function OnKeyUp( a_event )
{
     if ( !g_client.m_start )
        return;

    var ev = a_event || window.event;

    g_client.m_downKeys[ ev.keyCode ] = false;
}

function OnMouseMove( a_event )
{
    var mouseX = a_event.pageX - canvas.offsetLeft;
    var mouseY = canvas.height - ( a_event.pageY - canvas.offsetTop );

    g_client.m_mouseMove        = true;
    g_client.m_mouseLastPos.m_x = mouseX;
    g_client.m_mouseLastPos.m_y = mouseY;
}

function OnClick( a_event )
{
    if ( !g_client.m_start )
        return;

    var mouseX = a_event.pageX - canvas.offsetLeft;
    var mouseY = canvas.height - ( a_event.pageY - canvas.offsetTop );

    g_client.m_commands.push( { type : Commands.ATTACK, pos : g_world.GetPlayerPos, vec : { m_x : mouseX, m_y : mouseY } } );

    document.getElementById( "mouse_click_pos" ).innerHTML = "Mouse click pos: (" + mouseX + ", " + mouseY + ")";
}

function ProcessUserInput()
{
    g_cursor.SetPos( g_client.m_mouseLastPos );
    document.getElementById( "mouse_pos" ).innerHTML = "Mouse pos: (" + g_client.m_mouseLastPos.m_x + ", " + g_client.m_mouseLastPos.m_y + ")";

    if ( !g_client.m_start )
        return;

    var shiftRTPlayer = { m_x : 0, m_y : 0 };

    //d
    if ( g_client.m_downKeys[ 68 ] )
    {
        ++g_client.m_shiftVec.m_x;
        ++shiftRTPlayer.m_x;
    }

    //a
    if ( g_client.m_downKeys[ 65 ] )
    {
        --g_client.m_shiftVec.m_x;
        --shiftRTPlayer.m_x;
    }

    //w
    if ( g_client.m_downKeys[ 87 ] )
    {
        ++g_client.m_shiftVec.m_y;
        ++shiftRTPlayer.m_y;
    }

    //s
    if ( g_client.m_downKeys[ 83 ] )
    {
        --g_client.m_shiftVec.m_y;
        --shiftRTPlayer.m_y;
    }

    g_world.m_rtPlayer.ShiftOn( shiftRTPlayer );

    //g_world.ProcessUserInput( shiftValue, g_client.m_mouseLastPos );
}

function SendUserInput()
{
    if ( !g_client.m_start )
        return;

    if ( ( g_client.m_shiftVec.m_x !== 0 ) || ( g_client.m_shiftVec.m_y !== 0 ) )
        g_client.m_commands.push( { type : Commands.MOVE, shift : g_client.m_shiftVec } );

    if ( g_client.m_commands.length !== 0 )
    {
        g_webSocket.send( JSON.stringify( { type : 'control', commands: g_client.m_commands } ) );
        ++g_client.m_sentInpCnt;
        InfLog( 'Sent user input. Total cnt: ' + g_client.m_sentInpCnt );
    }

    g_client.m_commands = [];
    g_client.m_shiftVec = { m_x : 0, m_y : 0 };
}

/// Client input handlers
/// End

function OnLoad()
{
	canvas = document.getElementById( 'game-canvas' );

    canvas.onmousemove = OnMouseMove;
    canvas.onclick     = OnClick;

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

    g_client            = new GameClient();
    g_cursor            = new Cursor( g_client.m_mouseLastPos );
    g_background        = new Background();
    g_world             = new World();
    setInterval( NextState, 20 );
    setInterval( SendUserInput, 50 );
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
}

function NextState()
{
    DrawGameField();

    if ( !g_client.m_start )
        return;

    g_world.Draw();

    ProcessUserInput();
}

function DrawGameField()
{
    gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );
    g_background.Draw();
    g_cursor.Draw();
}

function GameClient ()
{
    this.m_shiftVec   = { m_x : 0.0, m_y : 0.0 };
    this.m_start        = false;
    this.m_downKeys     = {};
    this.m_mouseLastPos = { m_x : 0, m_y : canvas.height };
    this.m_commands     = [];
    this.m_sentInpCnt   = 0;
}
