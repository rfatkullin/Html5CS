var Logger 			= require( '../shared/logger' ).Logger;
var GameModule 		= require( './server_game' );

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

	switch ( a_msg.type )
	{
		case 'login_get' :
			Logger.Info( 'Client trying to connect. Sent login: ' + this.m_userId );
			this.send( JSON.stringify( { type : 'login', login : this.m_userId, teamId : this.m_teamId } ) );
			break;

		case 'login_ack' :
			Logger.Info( '[CL=' + this.m_userId + '] Logined.' );
			this.m_logined = true;
			g_world.AddNewPlayer( this.m_userId );
			break;

		case 'control' :
			//Logger.Info( '[CL=' + this.m_userId + ']:' + ' Received control.' );
			g_world.ProcessUserInput( this.m_userId, a_msg.commands );
			break;

		case 'update_ack' :
			//Logger.Info( '[CL=' + this.m_userId + ']:' + ' Received update ack ' + a_msg.tick );
			this.m_lastAckSnapshot = a_msg.tick;
			break;

		default :

			Logger.Error( 'Unexpected request.' );
	}
}

function OnClose()
{
	var delList = {};
	delList[ this.m_userId ] = true;
	g_world.DeleteObjects( delList );

	delete g_server.m_conns[ this.m_userId ];

	--g_server.m_usersCnt;

	Logger.Info( '[CL=' + this.m_userId + ']' + ' left.' );
}

function GameServerWrapper()
{
	var WEB_SOCKET_SERVER_PORT 	= 1024;

	var Init = function ()
	{
		m_webSocketServer	= require( 'ws' ).Server;
		m_server 			= new m_webSocketServer( { port : WEB_SOCKET_SERVER_PORT } );
		m_server.m_wrapper  = this;
		this.m_conns  		= {};
		this.m_tick 		= 1;
		this.m_usersCnt		= 0;

		m_server.on( 'connection', function( a_ws )
		{
			Logger.Info( 'User connected.' );

			this.m_wrapper.AddConn( a_ws );
			++this.m_wrapper.m_usersCnt;

			a_ws.on( 'message', MessageProcess );
			a_ws.on( 'close', OnClose );
		} );

		Logger.Info( 'Server is started.' );
	}

	this.AddConn = function ( a_conn )
	{
		var connId 					= g_world.GetUniqueId();
		a_conn.m_userId 			= connId;
		a_conn.m_ack 				= 0;
		a_conn.m_lastAckSnapshot 	= 0;

		this.m_conns[ connId ] = a_conn;
	}

	Init.call( this );
}

function SendSnapshots()
{
	var sentSnapshotsCnt = 0;

	for ( var connId in g_server.m_conns )
	{
		conn = g_server.m_conns[ connId ];

		if ( !conn.m_logined )
			continue;

		var sendSnapshot = g_world.GetSnapshotDiff( conn.m_lastAckSnapshot );

		//Logger.Info( 'Snapshot: ' + JSON.stringify( sendSnapshot ) );

		conn.send( JSON.stringify( { type	: 'update',
									 tick 	: g_server.m_tick,
									 world 	: sendSnapshot } ) );

		++sentSnapshotsCnt;
	}

	//Logger.Info( 'User cnt = ' + g_server.m_usersCnt + '. Sent snapshots cnt = ' + sentSnapshotsCnt );
}

function TickHandler()
{
	g_world.NextStep( TICKS_INTERVAL / MSECS_INSEC, g_server.m_tick );

	SendSnapshots();

	++g_server.m_tick;
}

function main()
{
	TICKS_INTERVAL 	= 30; // 30 msec.
	MSECS_INSEC		= 1000;


	g_world  = new GameModule.CreateWorld();
	// g_server = new GameServerWrapper();

	// setInterval( TickHandler, TICKS_INTERVAL );

	g_world.TestIntersections();
}

main();
