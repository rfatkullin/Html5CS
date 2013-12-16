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

			if ( this.m_sentLogin === false )
			{
				this.send( JSON.stringify( { type : 'login', login : this.m_playerId, teamId : this.m_teamId } ) );
				this.m_sentLogin = true;
				Logger.Info( 'Sent login: ' + this.m_playerId );
			}
			break;

		case 'login_ack' :
			this.m_logined = true;
			g_world.AddNewPlayer( this.m_playerId );
			Logger.Info( '[CL=' + this.m_playerId + '] Logined.' );
			break;

		case 'control' :
			g_world.ProcessControl( currTime - this.m_ping - Game.INTER_TIME, this.m_playerId, a_msg.commands );
			//Logger.Info( '[CL=' + this.m_playerId + ']:' + ' Received control.' );
			break;

		case 'update_ack' :
			this.m_lastAckSnapshot = a_msg.tick;
			//Logger.Info( '[CL=' + this.m_playerId + ']:' + ' Received update ack ' + a_msg.tick );
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
	this.m_tick 				= 1;
	this.m_usersCnt				= 0;

	this.AddConn = function ( a_conn )
	{
		var connId 					= g_world.GetUniqueId();
		a_conn.m_playerId 			= connId;
		a_conn.m_ack 				= 0;
		a_conn.m_lastAckSnapshot 	= 0;
		a_conn.m_sentLogin 			= false;
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

		var sendSnapshot = g_world.GetSnapshotDiff( conn.m_lastAckSnapshot );

		conn.send( JSON.stringify( { type	: 'update',
									 tick 	: g_server.m_tick,
									 world 	: sendSnapshot } ) );
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

function TickHandler()
{
	g_world.NextStep( GetTime(), TICKS_INTERVAL / MSECS_IN_SEC, g_server.m_tick );

	SendSnapshots();

	++g_server.m_tick;
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
}

main();
