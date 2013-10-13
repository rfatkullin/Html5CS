var webSocketServer = require( 'websocket' ).server;
var http = require( 'http' ); 

var WEB_SOCKET_SERVER_PORT = 1024;


var server = http.createServer( function ( request, response ) {} );

server.listen( WEB_SOCKET_SERVER_PORT, function()
{
	console.log( new Date() + ': Server is listening on port: ' + WEB_SOCKET_SERVER_PORT );
} );

var wsServer = new webSocketServer( { httpServer: server } );

wsServer.on( 'request', function( a_request ) 
{
	console.log( new Date() + ': Connection from origin: ' + a_request.origin + '.' );

	var connection = a_request.accept( null, a_request.origin );

	console.log( new Date() + ': Connection accepted.' );

	connection.on( 'message', function( a_message )
	{
		console.log( new Date() + ': Text from user: ' + a_message.utf8Data );
	});

	connection.on( 'close', function( a_connection )
	{
		console.log( new Date() + ': User ' + a_connection.remoteAddress + 'disconnected' );
	});
});



wsServer.on( 'message', function( message )
{
	console.log( new Date() + ': Message from')
});

