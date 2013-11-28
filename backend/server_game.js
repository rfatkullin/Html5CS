var jQuery   = require( 'jquery' );
var Geometry = require( './server_geometry.js' ).Geometry;
var Logger   = require( '../shared/logger' ).Logger;
var Commands = require( '../shared/commands' ).Commands;
var Player   = require( '../shared/constants' ).Player;


var CreateWorld = function()
{
	var SNAPSHOTS_CNT 	= 40; // sequence for 1000 / TICKS_INTERVAL * SNAPSHOTS_CNT seconds
	var MAP_WIDTH		= 800;
	var MAP_HEIGHT		= 600;

	this.GenerateMap = function ()
	{
		var wall1 = { m_id   : this.GetUniqueId(),
					  m_type : 'wall',
					  m_pos  : { m_x : 200.0, m_y : 300.0 } };

		var wall2 = { m_id   : this.GetUniqueId(),
					  m_type : 'wall',
					  m_pos  : { m_x : 500.0, m_y : 500.0 } };

		this.m_world[ wall1.m_id ] = wall1;
		this.m_world[ wall2.m_id ] = wall2;

		this.m_walls[ wall1.m_id ] = new Geometry.Rectangle( wall1.m_pos, Wall.WIDTH, Wall.HEIGHT );
		this.m_walls[ wall2.m_id ] = new Geometry.Rectangle( wall2.m_pos, Wall.WIDTH, Wall.HEIGHT );

		TeamsDeployPos = [ { m_x : 100, 			m_y : MAP_HEIGHT / 2 },
						   { m_x : MAP_WIDTH - 100, m_y : MAP_HEIGHT / 2 } ];

		TeamsDir 	   = [ { m_x :  1, m_y : 0 },
						   { m_x : -1, m_y : 0 } ];
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

	this.ProcessAllInputs = function()
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

							this.CreateBullet( objId, player.m_commands[ i ].pos, player.m_commands[ i ].dir );
							break;

						case Commands.MOVE :

							this.MovePlayer( objId, player.m_commands[ i ].shift );
							break;

						case Commands.CHANGE_DIR :

							this.PlayerChangeDir( objId, player.m_commands[ i ].dir );
							break;

						default :

							Logger.Error( '[CL= ' + objId + ' ]: Non-existent command: ' + player.m_commands[ i ].type + '.' );
							break;
					}
				}
			}

			player.m_commands = [];
		}
	}

	this.PlayerChangeDir = function ( a_playerInd, a_dir )
	{
		var player = this.m_world[ a_playerInd ];

		player.m_dir = a_dir;

		this.m_updObjs[ a_playerInd ] = player;
	}

	this.MovePlayer = function( a_playerInd, a_shift )
	{
		var player = this.m_world[ a_playerInd ];

		player.m_pos.m_x += Player.VEL * a_shift.m_x;
		player.m_pos.m_y += Player.VEL * a_shift.m_y;

		this.m_updObjs[ a_playerInd ] = player;
	}

	this.IsOutOfField = function ( a_pos )
	{
		if ( a_pos.m_x < 0 || a_pos.m_x > MAP_WIDTH ||
			 a_pos.m_y < 0 || a_pos.m_y > MAP_HEIGHT )
			return true;

		return false;
	}

	this.MoveAllObjects = function ( a_expiredTime )
	{
		for ( var id in this.m_world )
		{
			if ( this.m_world[ id ].m_vel === undefined )
				continue;

			var modObj = this.m_world[ id ];

			modObj.m_pos.m_x += a_expiredTime * modObj.m_vel.m_x;
			modObj.m_pos.m_y += a_expiredTime * modObj.m_vel.m_y;

			if ( this.IsOutOfField( modObj.m_pos ) === true )
			{
				var delList = {};
				delList[ id ] = true;
				this.DeleteObjects( delList );
			}

			this.m_updObjs[ id ] = this.m_world[ id ];
		}
	}

	this.DeleteObjects = function ( a_idList )
	{
		for ( var id in a_idList )
		{
			switch ( this.m_world[ id ].m_type )
			{
				case 'player' :
					this.m_teams[ this.m_world[ a_userId ].m_teamId ]--
					delete this.m_players[ id ];
					break;

				case 'bullet' :
					delete this.m_bullets[ id ];
					break;

				case 'wall' :
					delete this.m_walls[ id ];
					break;

				default :
					break;
			}

			this.m_delObjs[ id ] = this.m_world[ id ];
			delete this.m_world[ id ];
			delete a_idList[ id ];
		}
	}

	this.CollisionsDetect = function()
	{
		var forDelete = {};

		for ( var bulletId in this.m_bullets )
		{
			for ( var wallId in this.m_walls )
			{
				if ( Geometry.PointInRect( this.m_world[ bulletId ].m_pos, this.m_walls[ wallId ] ) === true )
					forDelete[ bulletId ] = true;
			}

			for ( var playerId in this.m_players )
			{
				if ( ( this.m_world[ bulletId ].m_teamId !== this.m_world[ playerId ].m_teamId ) &&
					 ( Geometry.PointInCircle( this.m_world[ bulletId ].m_pos, this.m_walls[ m_players ],m_pos, Player.RAD ) === true ))
				{
					forDelete[ bulletId ] = true;
					forDelete[ playerId ] = true;
				}
			}
		}

		this.DeleteObjects( forDelete );
	}

	this.SnapshotWorld = function ( a_currTick )
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
	}

	this.NextStep = function ( a_expiredTime, a_currTick )
	{
		this.MoveAllObjects( a_expiredTime );
		this.ProcessAllInputs();
		this.CollisionsDetect();
		this.SnapshotWorld( a_currTick );
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
				delete delObjs[ id ];
				delete addObjs[ id ];
				delete updObjs[ id ];
			}
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

		var pos = jQuery.extend( false, {}, TeamsDeployPos[ teamId ] );
		var dir = jQuery.extend( false, {}, TeamsDir[ teamId ] );

		var player = { m_id     	: a_userId,
					   m_type   	: 'player',
					   m_teamId 	: teamId,
					   m_pos 		: pos,
					   m_dir  		: dir,
					   m_commands 	: [] };

		this.m_world[ a_userId ]   = player;
		this.m_players[ a_userId ] = true;
		this.m_addObjs[ a_userId ] = player;
	}

	this.CreateBullet = function ( a_playerId, a_pos, a_dir )
	{
		var pos = { m_x : a_pos.m_x + a_dir.m_x * Player.BARREL_LENGTH,
					m_y : a_pos.m_y + a_dir.m_y * Player.BARREL_LENGTH
				  }

		var vel = { m_x : a_dir.m_x * Bullet.VEL,
					m_y : a_dir.m_y * Bullet.VEL };

		var bullet = { m_id     : this.GetUniqueId(),
					   m_type   : 'bullet',
					   m_pos    : pos,
					   m_vel    : vel,
					   m_ownId  : a_playerId,
					   m_teamId : this.m_world[ a_playerId ].m_teamId };

		this.m_world[ bullet.m_id ]   = bullet;
		this.m_bullets[ bullet.m_id ] = true;
		this.m_addObjs[ bullet.m_id ] = bullet;
	}

	this.m_currObjId		= 0;
	this.m_playersCnt		= 0;
	this.m_world    		= {};
	this.m_addObjs  		= {};
	this.m_updObjs			= {};
	this.m_delObjs			= {};
	this.m_snapshotObjList 	= []
	this.m_teams			= [ 0, 0 ];

	this.m_walls 			= {};
	this.m_players 			= {};
	this.m_bullets 			= {};

	this.GenerateMap();
}

module.exports.CreateWorld = CreateWorld;