var Logger 			= require( '../shared/logger' ).Logger;
var Game 			= require( '../shared/constants' ).Game;
var GameModule 		= require( './server_game' );

function GetTime()
{
	return ( new Date() ).getTime();
}

function OnMessage( a_msg )
{
	try
	{
		a_msg = JSON.parse( a_msg );
	}
	catch ( a_exc )
	{
		Logger.Error( 'Invalid JSON: ' + a_msg );
		return;
	}

	var currTime = GetTime();
	switch ( a_msg.type )
	{
		case 'pong'	:
			this.m_ping = ( currTime - this.m_pingStartTime ) / 2.0;

			if ( this.m_logined === false )
			{
				this.m_logined = true;
				g_game.AddNewPlayer( this.m_playerId );
				this.send( JSON.stringify( { type : 'login', login : this.m_playerId, teamId : this.m_teamId } ) );
				Logger.Info( 'Sent login: ' + this.m_playerId );
			}
			break;

		case 'control' :
			if ( g_game.PlayerAlive( this.m_playerId ) )
				g_game.ProcessControl( currTime - this.m_ping - a_msg.m_interVal, this.m_playerId, a_msg.commands );
			break;

		default :

			Logger.Error( 'Unexpected request.' );
	}
}

function ClientLeft( a_ws )
{
	g_game.DeletePlayer( a_ws.m_playerId );
	delete g_server.m_conns[ a_ws.m_playerId ];	
}

function OnError()
{
	ClientLeft( this );
	Logger.Info( '[CL=' + this.m_playerId + ']' + ' connection error - left.' );
}

function OnClose()
{
	ClientLeft( this );
	Logger.Info( '[CL=' + this.m_playerId + ']' + ' close connection - left.' );
}

function GameServerWrapper()
{
	var WEB_SOCKET_SERVER_PORT 	= 1024;
	var thisObj 				= this;
	var webSocketServer			= require( 'ws' ).Server;
	var server 					= new webSocketServer( { port : WEB_SOCKET_SERVER_PORT } );
	this.m_conns  				= {};	
	this.m_prevTime				= GetTime();
	this.AddConn = function ( a_conn )
	{
		var connId 					= g_game.GetUniqueId();
		a_conn.m_playerId 			= connId;
		a_conn.m_ack 				= 0;
		a_conn.m_lastAckSnapshot 	= 0;
		a_conn.m_logined 			= false;
		a_conn.m_isNewConn			= true;
		this.m_conns[ connId ] 		= a_conn;		
	}

	this.GetExpiredTime = function ()
	{
		var currTime 	= GetTime();
		var expired  	= currTime - this.m_prevTime;
		this.m_prevTime = currTime;

		return expired / Game.MSECS_IN_SEC;
	}

	server.on( 'connection', function( a_ws )
	{
		thisObj.AddConn( a_ws );
		a_ws.on( 'message', OnMessage );
		a_ws.on( 'close', OnClose );

		SendPing( a_ws );

		Logger.Info( 'User connected.' );
	} );

	Logger.Info( 'Server is started.' );
}

function SendSnapshots()
{
	for ( var connId in g_server.m_conns )
	{
		conn = g_server.m_conns[ connId ];

		if ( !conn.m_logined )
			continue;

		if ( !g_game.PlayerAlive( conn.m_playerId ) )
		{
			conn.close();
			continue;
		}

		var data = {};

		if ( conn.m_isNewConn )
		{
			data.isDiff = false;
			data.snapshot = g_game.GetWholeWorld();
			conn.m_isNewConn = false;
		}
		else
		{
			data.isDiff = true;
			data.diff = g_game.GetSnapshotDiff();
		}

		try
		{
			conn.send( JSON.stringify( { type		: 'update',
										 world 		: data } ) );
		}
		catch ( a_excp )
		{
			Logger.Info( 'Can\'t send snapshot to [CL=' + conn.m_playerId + ']' );
		}
	}
}

function SendPing( a_ws )
{
	try
	{
		a_ws.m_pingStartTime = GetTime();
		a_ws.send( JSON.stringify( { type : 'ping' } ) );
	}
	catch ( a_excp )
	{

	}
}

function UpdatePings()
{
	for ( var connId in g_server.m_conns )
	{
		conn = g_server.m_conns[ connId ];

		if ( !conn.m_logined )
			continue;

		SendPing( conn );
	}
}

function PrintPings()
{
    for ( var connId in g_server.m_conns )
    {
        conn = g_server.m_conns[ connId ];

        if ( !conn.m_logined )
                continue;

        Logger.Info( 'Ping for client ' + conn.m_playerId + ' = '  + conn.m_ping / Game.MSECS_IN_SEC );
    }
}

function TickHandler()
{
	g_game.NextStep( GetTime(), g_server.GetExpiredTime() );

	SendSnapshots();
}

function main()
{
	TICKS_INTERVAL 	  = 30;    // 30 msec.
	PING_UPD_INTERVAL = 1000 // 1 minute

	g_game  = new GameModule.CreateGame();
	g_server = new GameServerWrapper();

	setInterval( TickHandler, TICKS_INTERVAL );
	setInterval( UpdatePings, PING_UPD_INTERVAL );
	//setInterval( PrintPings, 1000 );
}

main();
