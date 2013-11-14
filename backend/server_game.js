var jQuery   = require( 'jquery' );
var Logger   = require( '../shared/logger' ).Logger;
var Commands = require( '../shared/commands' ).Commands;
var Player   = require( '../shared/constants' ).Player;

var CreateWorld = function()
{
	var SNAPSHOTS_CNT 	= 40; // sequence for 1000 / TICKS_INTERVAL * SNAPSHOTS_CNT seconds
	var MAP_WIDTH		= 800;
	var MAP_HEIGHT		= 600;
	var BULLET_VEL		= 100;

	var Init = function ()
	{
		this.m_currObjId		= 0;
		this.m_playersCnt		= 0;
		this.m_world    		= {};
		this.m_addObjs  		= {};
		this.m_updObjs			= {};
		this.m_delObjs			= {};
		this.m_snapshotObjList 	= []
		this.m_teams			= [ 0, 0 ];
		this.m_moveCmdCnt		= 0;

		GenerateMap.call( this );
	}

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

		TeamsDeployPos = [ { m_x : 100, 			m_y : MAP_HEIGHT / 2 },
						   { m_x : MAP_WIDTH - 100, m_y : MAP_HEIGHT / 2 } ];
	}

	this.GetUniqueId = function ()
	{
		return this.m_currObjId++;
	}

	this.ProcessUserInput = function( a_userId, a_controlObj )
	{
		Logger.Info( '[CL=' + a_userId + ']: Cmd: ' + JSON.stringify( a_controlObj ));

		this.m_world[ a_userId ].m_commands = this.m_world[ a_userId ].m_commands.concat( a_controlObj );
	}

	var ProcessAllInputs = function()
	{
		for ( var objId in this.m_world )
		{
			if ( this.m_world[ objId ].m_type != 'player' )
				continue;

			var player = this.m_world[ objId ];

			if ( player.m_commands.length != 0 )
			{
				for ( var i = 0; i < player.m_commands.length; ++i )
				{
					switch ( player.m_commands[ i ].type )
					{
						case Commands.ATTACK :
							//CreateBullet( i, command.pos, command.dir );
							Logger.Info( '[CL=' + objId + ']: Attack command.' );
							break;

						case Commands.MOVE :
							MovePlayer.call( this, objId, player.m_commands[ i ].shift );
							++this.m_moveCmdCnt;
							Logger.Info( '[CL=' + objId + ']: Move command. Total move commands cnt: ' + this.m_moveCmdCnt );
							break;
						default :
							Logger.Error( '[CL=' + objId + ']: Non-existent command: ' + player.m_commands[ i ].type + '.' );
							break;
					}
				}
			}

			player.m_commands = [];
		}
	}

	var MovePlayer = function( a_playerInd, a_shift )
	{
		var player = this.m_world[ a_playerInd ];

		player.m_pos.m_x += Player.VEL * a_shift.m_x;
		player.m_pos.m_y += Player.VEL * a_shift.m_y;

		this.m_updObjs[ a_playerInd ] = player;
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

			this.m_updObjs[ id ] = this.m_world[ id ];
		}
	}

	var CollisionsDetect = function()
	{

	}

	var SnapshotWorld = function ( a_currTick )
	{
		if ( this.m_snapshotObjList.length > SNAPSHOTS_CNT )
			this.m_snapshotObjList.shift();

		for ( var id in this.m_delObjs )
			delete this.m_world[ id ];

		this.m_snapshotObjList.push( {  m_tick 	   : a_currTick,
										m_addObjs  : jQuery.extend( true, {}, this.m_addObjs ),
										m_updObjs  : jQuery.extend( true, {}, this.m_updObjs ),
										m_delObjs  : jQuery.extend( true, {}, this.m_delObjs ),
									    m_snapshot : jQuery.extend( true, {}, this.m_world ) } );

	    this.m_addObjs  = {};
		this.m_updObjs	= {};
		this.m_delObjs	= {};

		//Logger.Info( '[T=' + a_currTick +'] Snapshot world.' );
	}

	this.NextStep = function ( a_expiredTime, a_currTick )
	{
		ProcessAllInputs.call( this );
		MoveAllObjects.call( this );
		CollisionsDetect.call( this );
		SnapshotWorld.call( this, a_currTick );

		//Logger.Info( '[T=' + a_currTick +'] NextStep completed.' );
	}

	this.GetSnapshotDiff = function ( a_startTick )
	{
		var firstInd  = -1;
		var secondInd = this.m_snapshotObjList.length - 1;

		var i = secondInd - 1;

		while ( ( i >= 0 ) && ( firstInd < 0 ) )
		{
			if ( this.m_snapshotObjList[ i ].m_tick === a_startTick )
				firstInd = i;

			--i;
		}

		if ( firstInd < 0 )
			return { isDiff : false, snapshot : this.m_snapshotObjList[ secondInd ].m_snapshot };

		var addObjs = {};
		var updObjs = {};
		var delObjs = {};

		for ( var i = firstInd + 1; i <= secondInd; ++i )
		{
			jQuery.extend( true, addObjs, this.m_snapshotObjList[ i ].m_addObjs );
			jQuery.extend( true, updObjs, this.m_snapshotObjList[ i ].m_updObjs );
			jQuery.extend( true, delObjs, this.m_snapshotObjList[ i ].m_delObjs );
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

		var diff = { m_addObjs : addObjs,
					 m_updObjs : updObjs,
					 m_delObjs : delObjs }

		return { isDiff : true, diff : diff };
	}

	this.AddNewPlayer = function ( a_userId )
	{
		var teamId = 0;

		if ( this.m_teams[ 0 ] > this.m_teams[ 1 ] )
			teamIdId = 1;

		var pos    = jQuery.extend( false, {}, TeamsDeployPos[ teamId ] );

		var player = { m_id     	: a_userId,
					   m_type   	: 'player',
					   m_teamId 	: teamId,
					   m_pos 		: pos,
					   m_commands 	: [] };

		this.m_world[ a_userId ]   = player;
		this.m_addObjs[ a_userId ] = player;
	}

	this.PlayerLeft = function ( a_userId )
	{
		this.m_teams[ this.m_world[ a_userId ].m_teamId ]--
		delete this.m_world[ a_userId ];
		this.m_delObjs[ a_userId ] = this.m_world[ a_userId ];
	}

	Init.call( this );
}

module.exports.CreateWorld = CreateWorld;