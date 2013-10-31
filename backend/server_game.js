var jQuery = require( 'jquery' );
var logger = require( '../shared/common_helpers' );

var CreateGame = function()
{
	var SNAPSHOTS_CNT 	= 40; // sequence for 1000 / TICKS_INTERVAL * SNAPSHOTS_CNT seconds
	var MAP_WIDTH		= 800;
	var MAP_HEIGHT		= 600;
	var BULLET_VEL		= 100;
	
	var GenerateMap = function ()
	{
		var wall1 = { m_id   : this.GetUniqueId(),
					  m_type : 'wall',  
					  m_pos  : { m_x : 200.0, m_y : 300.0 } };

		var wall2 = { m_id   : this.GetUniqueId(),
					  m_type : 'wall', 
					  m_pos  : { m_x : 500.0, m_y : 500.0 } };

		this.m_world[ wall1.m_id ] = wall1;
		this.m_world[ wall2.m_id ] = wall2;
	}

	var InitSnapshots = function ()
	{
		this.m_snapshotObjList.push( { 	m_tick     : 0, 
										m_add      : [], 
										m_update   : [], 
										m_delete   : [], 
										m_snapshot : {} } );

		var add =[]; 
		for ( var key in this.m_world )
			add.push( key );

		this.m_snapshotObjList.push( {  m_tick 	   : 1, 
									    m_add 	   : add, 
										m_update   : {}, 
										m_delete   : {}, 
										m_snapshot : jQuery.extend( true, {}, this.m_world ) } );
	}

	this.InitWorld = function ()
	{
		this.m_world    		= {};		
		this.m_addObjs  		= {}; 
		this.m_updateObjs		= {}; 
		this.m_deleteObjs		= {};
		this.m_snapshotObjList 	= []

		GenerateMap.apply( this );
		InitSnapshots.apply( this );		
	}	

	this.GetUniqueId = function ()
	{
		return this.m_currObjId++;
	}

	this.ProcessUserInput = function( a_userId, a_controlObj )
	{
		this.m_world[ a_userId ].m_commands = a_controlObj;
	}

	var ProcessAllInputs = function()
	{
		for ( var id in this.m_world )
		{
			if ( this.m_world[ id ].m_type != 'player' )
				continue;

			var player = this.m_world[ id ];

			if ( player.m_commands.length != 0 )
			{
				for ( var command in player.m_commands )
				{
					switch ( command.type )
					{
						case GameCommands.Commands.ATTACK :							
							CreateBullet( i, command.pos, command.dir );
							InfoLog( 'Process attack command for client ' + i + '.' ); 							
							break;

						case GameCommands.Commands.MOVE :
							MovePlayer( i, command.diff )
							InfoLog( 'Process move command for client ' + i + '.' ); 							
							break;
						default :
							ErrLog( 'Non-existent command from client ' + i + '!' ); 
							break;
					}
				}
			}

			player.m_commands = [];
		}
	}

	var MovePlayer = function( a_playerInd )
	{
		var player = this.m_world[ a_playerInd ];
			
		player.m_pos.m_x += a_diff.x;
		player.m_pos.m_y += a_diff.y;

		this.m_updateObjs.push( a_playerInd );
	}

	var CreateBullet = function ( a_playerId, a_pos, a_dir )
	{
		var pos = jQuery.extend( true, {}, a_pos );						
		var vel = { m_x : a_dir.m_x * BULLET_VEL, 
					m_y : a_dir.m_y * BULLET_VEL };
		
		var bullet = { m_id    : this.GetUniqueId(),
					   m_type  : 'bullet',
					   m_pos   : pos,
					   m_vel   : vel,
					   m_ownId : a_playerInd,
					   m_team  : this.m_world[ a_playerInd ].m_teamId };		
						   
		this.m_world[ bullet.m_id ] = bullet;
		this.m_addObjs.push( bullet.m_id );
	}

	var MoveAllObjects = function ( a_expiredTime )
	{
		for ( var id in this.m_world )
		{
			if ( this.m_world[ id ].m_vel === undefined )
				continue;

			var modObj = this.m_world[ id ];
			
			modObj.m_pos.m_x += a_expiredTime * modObj.m_vel.m_x;
			modObj.m_pos.m_y += a_expiredTime * modObj.m_vel.m_y;			

			this.m_updateObjs.push( id );
		}
	}

	var CollisionsDetect = function()
	{

	}
	
	var CreateSnapshot = function ( a_currTick )
	{
		if ( this.m_snapshotObjList.length > SNAPSHOTS_CNT )
			this.m_snapshotObjList.shift();

		this.m_snapshotObjList.push( {  m_tick 	   : a_currTick,
										m_add 	   : this.m_addObjs, 
										m_update   : this.m_updateObjs, 
										m_delete   : this.m_deleteObjs,  
									    m_snapshot : jQuery.extend( true, {}, this.m_world ) } );

	    this.m_addObjs  	= {}; 
		this.m_updateObjs	= {}; 
		this.m_deleteObjs	= {};
	}

	this.NextStep = function ( a_expiredTime, a_currTick )
	{
		ProcessAllInputs.apply( this );
		MoveAllObjects.apply( this );
		CollisionsDetect.apply( this );
		CreateSnapshot.apply( this, a_currTick );
	}

	this.GetSnapshotDiff = function ( a_startTick )
	{
		var firstInd  = -1;
		var secondInd = this.m_snapshotObjList.length - 1;
		
		var i = secondInd - 1;

		while ( ( i >= 0 ) && ( firstInd < 0 ) )
		{
			if ( this.m_snapshotObjList[ i ].m_tick === a_fromSnapshotTick )
				firstInd = i;

			--i;
		}

		if ( firstInd < 0 )
			return [ false, this.m_snapshotObjList[ secondInd ]  ];
		
		var addObjs = {};
		var updObjs = {};
		var delObjs = {};

		for ( var i = nextInd + 1; i <= secondInd; ++i )
		{			
			jQuery( addObjs, this.m_snapshotObjList[ i ].m_add );
			jQuery( updObjs, this.m_snapshotObjList[ i ].m_update );
			jQuery( delObjs, this.m_snapshotObjList[ i ].m_delete );			
		}

		for ( var id in delObjs )
		{
			if ( id in addObjs )
			{
				delete deleteObjs[ id ];
				delete addObjs[ id ];
			}

			if ( id in updObjs )
				delete updObjs[ id ];
		}

		var addObjsArr = [];
		var updObjsArr = [];
		var delObjsArr = [];

		for ( var id in addObjs )
			addObjsArr.push( id );

		for ( var id in updObjs )
			updObjsArr.push( id );

		for ( var id in delObjs )
			delObjsArr.push( id );

		var snapshotObj = { m_tick 	   : this.m_snapshotObjList[ secondInd ].m_tick,
							m_add 	   : addObjsArr, 
							m_update   : updObjsArr, 
							m_delete   : delObjsArr,  
						    m_snapshot : jQuery.extend( true, {}, this.m_snapshotObjList[ secondInd ].m_snapshot ) };

		return [ true, snapshotObj ];
	}
	
	this.AddNewPlayer = function ( a_userId )
	{		
		var teamId = m_players.length % 2;
		var pos    = jQuery.extend( false, {}, TeamsDeployPos[ teamId ] ); 

		var player = { m_id     : a_userId,
					   m_type   : 'player',
					   m_teamId : teamId, 
					   m_pos 	: pos };

		this.m_addObjs.push( player );		
	}
}

module.exports.CreateGame = CreateGame;