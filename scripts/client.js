function OnOpen()
{
    InfLog( 'Connected to server.' );
}

function OnClose()
{
   g_client.m_start = false;
    InfLog( 'Close connection.' );
}

function OnError( a_error )
{
    if ( a_error.data === undefined )
    {
        ErrLog( 'Cannot connect to server.' );
        alert( 'Cannot connect to server.' );
    }
    else
        ErrLog( a_error.data );

    g_client.m_start = false;
}

function OnMessage( a_msg )
{
    a_msg = JSON.parse( a_msg.data );

    switch ( a_msg.type )
    {
        case 'ping' :
            g_webSocket.send( JSON.stringify( { type : 'pong' } ) );
            break;
        case 'login' :
            InfLog( '[RECV]: Get login: ' + a_msg.login );
            g_game.SetPlayerInfo( a_msg.login );
            g_client.m_start = true;
            break;

        case 'update' :
            g_game.Update( a_msg );
            break;

        default :
            ErrLog( '[RECV]: Non-existent command.' );
    }
}

function UpdateInterpolateValue()
{
    g_game.INTER_TIME = document.getElementById( 'inter_val' ).value;
    document.getElementById( 'inter_val_text' ).innerHTML = 'Задержка интерполяции: ' +  g_game.INTER_TIME + ' мсек';
}

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

function MouseWorldPos( a_event )
{
    var pos = { m_x : a_event.pageX - canvas.offsetLeft,
                m_y : canvas.height - ( a_event.pageY - canvas.offsetTop ) };

    var res = { m_outOfField : false,
                m_pos : pos };

    if ( ( pos.m_x > canvas.width ) || ( pos.m_y > canvas.height ) )
        res.m_outOfField = true;

    return res;
}

function OnMouseMove( a_event )
{
    var res = MouseWorldPos( a_event );

    if ( res.m_outOfField === false )
        g_client.m_mouseLastPos = res.m_pos;
    else
        g_client.m_mouseLastPos = { m_x : 0, m_y : 0 };

    this.m_mouseMove = true;
    g_cursor.SetPos( g_client.m_mouseLastPos );
}

function OnMouseDown( a_event )
{
    if ( a_event.preventDefault )
    {
        a_event.preventDefault();
        a_event.stopPropagation();
    }
    else
    {
        a_event.returnValue = false;
        a_event.cancelBubble = true;
    }
}

function OnClick( a_event )
{
    if ( !g_client.m_start )
        return;

    var mouseWorldPos = MouseWorldPos( a_event );

    if ( mouseWorldPos.m_outOfField === true )
        return;

    ProcessPlayerAttack( mouseWorldPos );
}

function ProcessPlayerAttack( a_mousePos )
{
    if ( !g_client.m_start )
        return;

    var command = { type  : Commands.ATTACK,
                    pos   : g_game.GetPlayerPos(),
                    point : a_mousePos.m_pos };
    g_webSocket.send( JSON.stringify( { type : 'control', m_interVal : g_game.INTER_TIME, commands : [ command ] } ) );
}

function ProcessInput()
{
    if ( !g_client.m_start )
        return;

    dirVec = { m_x : 0, m_y : 0 };

    if ( g_client.m_downKeys[ 68 ] === true )
        ++dirVec.m_x;

    if ( g_client.m_downKeys[ 65 ] === true )
        --dirVec.m_x;

    if ( g_client.m_downKeys[ 87 ] === true )
        ++dirVec.m_y;

    if ( g_client.m_downKeys[ 83 ] === true )
        --dirVec.m_y;

    var commands = [];
    //Поменял направление
    if ( ( g_client.m_prevDir.m_x !== dirVec.m_x ) || ( g_client.m_prevDir.m_y !== dirVec.m_y ) )
    {
        var command = { type : Commands.CHANGE_MOVE_DIR,
                        dir  : dirVec };
        commands.push( command );
        g_client.m_prevDir = dirVec;
    }

    //Обрабатываем движение мышки
    if ( this.m_mouseMove )
    {
        var command = { type     : Commands.CHANGE_DIR,
                        dirPoint : g_client.m_mouseLastPos };
        commands.push( command );
        this.m_mouseMove = false;
    }

    if ( commands.length > 0 )
        g_webSocket.send( JSON.stringify( { type : 'control', commands : commands } ) );
}

function UpdateExtrapolation()
{
    var info = g_game.GetExtrapolationInfo();

    document.getElementById( 'aver_extrapolation' ).innerHTML = 'Среднее время экстраполяции за последние 3 сек: ' + info.m_aver + ' сек';
    document.getElementById( 'last_extrapolation' ).innerHTML = 'Последняя экстраполяции: на ' + info.m_last + ' сек';
}

function OnLoad()
{
    InitGL();  

    g_client        = new GameClient();
    g_cursor        = new Cursor( g_client.m_mouseLastPos );
    g_background    = new Background();
    g_game          = new CreateGame();

    setInterval( NextState, 20 );
    setInterval( UpdateExtrapolation, 3000 );
}

function Connect( a_button )
{
    if ( a_button.value === 'Connect' )
        a_button.value = 'Reconnect';
    else
        g_webSocket.close();

    g_client = new GameClient();
    g_game  = new CreateGame();

    UpdateInterpolateValue();

    //g_webSocket = new WebSocket( 'ws://localhost:1024' );
    g_webSocket = new WebSocket( 'ws://5.231.71.26:1024' );

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

    ProcessInput();
    g_game.Draw();
    g_cursor.Draw();
}

function DrawGameField()
{
    gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );
    g_background.Draw();
}

function GameClient ()
{    
    this.m_start        = false;
    this.m_downKeys     = {};
    this.m_prevDir      = {};
    this.m_mouseMove    = false;    
    this.m_mouseLastPos = { m_x : 0, m_y : canvas.height };    
}
