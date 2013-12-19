var Logger 			= require( '../shared/logger' ).Logger;
var Game 			= require( '../shared/constants' ).Game;
var GameModule 		= require( './server_game' );

function GetTime()
{
	return ( new Date() ).getTime();
}

function MessageProcess( a_msg )
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
				g_world.AddNewPlayer( this.m_playerId );
				this.send( JSON.stringify( { type : 'login', login : this.m_playerId, teamId : this.m_teamId } ) );
				Logger.Info( 'Sent login: ' + this.m_playerId );
			}
			break;

		case 'control' :
			if ( g_world.PlayerAlive( this.m_playerId ) )
				g_world.ProcessControl( currTime - this.m_ping - Game.INTER_TIME, this.m_playerId, a_msg.commands );
			break;

		default :

			Logger.Error( 'Unexpected request.' );
	}
}

function OnClose()
{
	g_world.DeletePlayer( this.m_playerId );
	delete g_server.m_conns[ this.m_playerId ];
	--g_server.m_usersCnt;

	Logger.Info( '[CL=' + this.m_playerId + ']' + ' left.' );
}

function GameServerWrapper()
{
	var WEB_SOCKET_SERVER_PORT 	= 1024;
	var thisObj 				= this;
	var webSocketServer			= require( 'ws' ).Server;
	var server 					= new webSocketServer( { port : WEB_SOCKET_SERVER_PORT } );
	this.m_conns  				= {};
	this.m_usersCnt				= 0;

	this.AddConn = function ( a_conn )
	{
		var connId 					= g_world.GetUniqueId();
		a_conn.m_playerId 			= connId;
		a_conn.m_ack 				= 0;
		a_conn.m_lastAckSnapshot 	= 0;
		a_conn.m_logined 			= false;
		a_conn.m_isNewConn			= true;
		this.m_conns[ connId ] 		= a_conn;
		++this.m_usersCnt;
	}

	server.on( 'connection', function( a_ws )
	{
		thisObj.AddConn( a_ws );
		a_ws.on( 'message', MessageProcess );
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

		if ( !g_world.PlayerAlive( conn.m_playerId ) )
		{
			conn.close();
			continue;
		}

		var data = {};

		if ( conn.m_isNewConn )
		{
			data.isDiff = false;
			data.snapshot = g_world.GetWholeWorld();
			conn.m_isNewConn = false;
		}
		else
		{
			data.isDiff = true;
			data.diff = g_world.GetSnapshotDiff();
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
	a_ws.m_pingStartTime = GetTime();
	a_ws.send( JSON.stringify( { type : 'ping' } ) );
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

        Logger.Info( 'Ping for client ' + conn.m_playerId + ' = '  + conn.m_ping / 1000.0 );
    }
}

function TickHandler()
{
	g_world.NextStep( GetTime(), TICKS_INTERVAL / MSECS_IN_SEC );

	SendSnapshots();
}

function main()
{
	TICKS_INTERVAL 	  = 30;    // 30 msec.
	MSECS_IN_SEC	  = 1000;
	PING_UPD_INTERVAL = 10000 // 1 minute

	g_world  = new GameModule.CreateWorld();
	g_server = new GameServerWrapper();

	setInterval( TickHandler, TICKS_INTERVAL );
	setInterval( UpdatePings, PING_UPD_INTERVAL );
	setInterval( PrintPings, 5000 );
}

main();
