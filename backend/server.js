
var GameCommands 	= require( '../shared/commands.js' );

function InfLog( a_msg )
{
	console.log( new Date() + '[INF]: ' + a_msg );
}

function ErrLog( a_msg )
{
	console.log( new Date() + '[ERR]: ' + a_msg );	
}

function AuthorizatonProcess( a_conn, a_req )
{
	if ( a_req.ack == a_conn.m_ack + 1 )
	{
		InfLog( 'Client connected. Login:' + a_req.m_login );
		++a_conn.m_ack;
		a_conn.m_logined = true;
		return;
	}

	a_conn.send( JSON.stringify( { type : 'login', ack : a_conn.m_ack, data : a_conn.m_userId } ) );
	
	InfLog( 'Client trying to connect. Sent login:' + a_conn.m_userId );	
}
 
function MessageProcess( a_msg )
{
	try 
	{
		var jsonMsg = JSON.parse( a_msg );
	} 
	catch ( a_exc ) 
	{
		ErrLog( 'Invalid JSON: ' + a_msg );
		return;
	}

	switch ( jsonMsg.type )
	{
		case 'get_login' :		
			AuthorizatonProcess( this, jsonMsg );
			break;
		
		case 'control' :
			g_game.ProcessUserInput( a_conn.m_userId, jsonMsg );
			InfLog( '[CL' + jsonMsg.login + ']:' + ' received control ' + jsonMsg.key.toString() );			
			break;

		case 'update' :
			this.m_ackSnapshot = jsonMsg.ackSnapshot;
			InfLog( '[CL' + jsonMsg.login + ']:' + ' received update ack ' + jsonMsg.key.toString() );
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
	a_conn.m_userId 		= g_game.GetUniqueId();
	a_conn.m_ack 			= 0;
	a_conn.m_ackSnapshot 	= 0;	
}

function SendSnapshot( a_snapshot )
{
	for ( var conn in g_server.m_connections )
	{
		if ( !conn.m_logined )
			continue;

		conn.send( JSON.stringify( { type     : 'update', 
									 snapshot : g_game.GetSnapshotsDiff( conn.m_ackSnapshot, g_server.m_tick ) } ) );
	}
}

function TickHandler()
{
	g_game.NextStep();

	SendSnapshot();

	++g_server.m_tick;
}

function main()
{
	var TICKS_INTERVAL 	= 20; // milliseconds	

	g_game = require( './world.js' ).CreateGame();

	g_game.InitWorld();

	InitServer();

	setInterval( TickHandler, TICKS_INTERVAL );
}

main();

 