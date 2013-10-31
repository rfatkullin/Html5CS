var GameCommands = require( '../shared/commands' );
var GameModule = require( './server_game' );

function InfLog( a_msg )
{
	console.log( new Date() + '[INF]: ' + a_msg );
}

function ErrLog( a_msg )
{
	console.log( new Date() + '[ERR]: ' + a_msg );	
}
 
function MessageProcess( a_conn, a_msg )
{
	try 
	{
		a_msg = JSON.parse( a_msg );
	} 
	catch ( a_exc ) 
	{
		ErrLog( 'Invalid JSON: ' + a_msg );
		return;
	}

	switch ( a_msg.type )
	{
		case 'login_get' :		
			a_conn.send( JSON.stringify( { type : 'login', login : a_conn.m_userId } ) );
			InfLog( 'Client trying to connect. Sent login:' + a_conn.m_userId );
			break;

		case 'login_ack' :
			a_conn.m_logined = true;
			g_serverGame.AddNewPlayer( a_conn.m_userId );
			InfLog( 'Client [' + a_conn.m_userId + ']  logined.' );
			break;

		case 'control' :
			g_serverGame.ProcessUserInput( a_conn.m_userId, a_msg );
			InfLog( '[CL' + a_msg.login + ']:' + ' received control ' + a_msg.key.toString() );			
			break;

		case 'update_ack' :
			a_conn.m_lastAckSnapshot = a_msg.tick;			
			InfLog( '[CL' + a_msg.login + ']:' + ' received update ack ' + a_msg.tick );
			break;

		default :

			ErrLog( 'Unexpected request.' );
	}
}

function InitServer()
{
	WEB_SOCKET_SERVER_PORT 	= 1024;	
	
	g_webSocketServer 		= require( 'ws' ).Server;
	g_server 				= new g_webSocketServer( { port : WEB_SOCKET_SERVER_PORT } );
	g_server.m_nextUserId	= 0;
	g_server.m_connections  = [];
	g_server.m_tick 		= 1;

	g_server.on( 'connection', function( a_ws )
	{
		console.log( 'User connected.' );
		InitConnection( a_ws, g_server.m_nextUserId++ );
		g_server.g_connections.push( a_ws );		
		a_ws.on( 'message', MessageProcess );
	} );

	InfLog( 'Server is started.' );	
}

function InitConnection( a_conn, a_userId )
{
	a_conn.m_userId 			= g_serverGame.GetUniqueId();
	a_conn.m_ack 				= 0;
	a_conn.m_lastAckSnapshot 	= 0;	
}

function SendSnapshots( a_snapshot )
{
	for ( var conn in g_server.m_connections )
	{
		if ( !conn.m_logined )
			continue;

		conn.send( JSON.stringify( { type     : 'update', 
									 snapshot : g_serverGame.GetSnapshotsDiff( conn.m_lastAckSnapshot, g_server.m_tick ) } ) );
	}
}

function TickHandler()
{
	g_serverGame.NextStep();

	SendSnapshots();

	++g_server.m_tick;
}

function main()
{
	var TICKS_INTERVAL 	= 20; // milliseconds
	
	g_serverGame = new GameModule.CreateGame();
	g_serverGame.InitWorld();

	InitServer();

	setInterval( TickHandler, TICKS_INTERVAL );
}

main();

 