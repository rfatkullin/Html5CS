var jQuery   		= require( 'jquery' );
var Geometry 		= require( './server_geometry.js' ).Geometry;
var Logger   		= require( '../shared/logger' ).Logger;
var Commands 		= require( '../shared/commands' ).Commands;
var Player   		= require( '../shared/constants' ).Player;
var Wall 	 		= require( '../shared/constants' ).Wall;
var EPSILON	 		= require( '../shared/constants' ).Geometry.EPSILON;

var CreateWorld = function()
{
	var SNAPSHOTS_CNT 	= 66; // 2 sec
	var MAP_WIDTH		= 800;
	var MAP_HEIGHT		= 600;

	this.NewWall = function ( a_pos )
	{
		var wall = { m_id   : this.GetUniqueId(),
					 m_type : 'wall',
					 m_pos  : a_pos };

		this.m_world[ wall.m_id ] = wall;
		this.m_walls[ wall.m_id ] = new Geometry.Rectangle( wall.m_pos, Wall.WIDTH, Wall.HEIGHT );
	}

	this.GenerateMap = function ()
	{
		this.NewWall( { m_x : 2.5 * Wall.WIDTH, m_y : MAP_HEIGHT - 1.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : 2.5 * Wall.WIDTH, m_y : MAP_HEIGHT - 2.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : 2.5 * Wall.WIDTH, m_y : MAP_HEIGHT - 3.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : 2.5 * Wall.WIDTH, m_y : MAP_HEIGHT - 4.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : 2.5 * Wall.WIDTH, m_y : MAP_HEIGHT - 5.5 * Wall.HEIGHT } );

		this.NewWall( { m_x : MAP_WIDTH - 2.5 * Wall.WIDTH, m_y : 1.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : MAP_WIDTH - 2.5 * Wall.WIDTH, m_y : 2.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : MAP_WIDTH - 2.5 * Wall.WIDTH, m_y : 3.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : MAP_WIDTH - 2.5 * Wall.WIDTH, m_y : 4.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : MAP_WIDTH - 2.5 * Wall.WIDTH, m_y : 5.5 * Wall.HEIGHT } );

		this.NewWall( { m_x : MAP_WIDTH - 10.5 * Wall.WIDTH, m_y : 8.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : MAP_WIDTH - 11.5 * Wall.WIDTH, m_y : 8.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : MAP_WIDTH - 10.5 * Wall.WIDTH, m_y : 7.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : MAP_WIDTH - 10.5 * Wall.WIDTH, m_y : 6.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : MAP_WIDTH -  9.5 * Wall.WIDTH, m_y : 6.5 * Wall.HEIGHT } );

		this.NewWall( { m_x : MAP_WIDTH - 5.5 * Wall.WIDTH, m_y : 12.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : MAP_WIDTH - 5.5 * Wall.WIDTH, m_y : 11.5 * Wall.HEIGHT } );

		this.NewWall( { m_x : 4.5 * Wall.WIDTH, m_y : 2.5 * Wall.HEIGHT } );
		this.NewWall( { m_x : 4.5 * Wall.WIDTH, m_y : 3.5 * Wall.HEIGHT } );

	}

	this.InitTeams = function ()
	{
		TeamsDeployPos = [ { m_x : 50, 			m_y : MAP_HEIGHT / 2 },
						   { m_x : MAP_WIDTH - 100, m_y : MAP_HEIGHT / 2 } ];

		TeamsDir 	   = [ { m_x :  1, m_y : 0 },
						   { m_x : -1, m_y : 0 } ];
	}

	this.GetUniqueId = function ()
	{
		return this.m_currObjId++;
	}

	this.ProcessControl = function( a_time, a_playerId, a_commands )
	{
		for ( var i = 0; i < a_commands.length; ++i )
		{
			var command = a_commands[ i ];

			switch ( command.type )
			{
				case Commands.ATTACK :

					this.ProcessAttack( a_time, a_playerId, command.pos, command.point );
					break;

				case Commands.CHANGE_MOVE_DIR :

					this.ChangePlayerMoveDir( a_playerId, command.dir );
					break;

				case Commands.CHANGE_DIR :

					this.ChangePlayerDirPoint( a_playerId, command.dirPoint );
					break;

				default :

					Logger.Error( '[CL= ' + a_playerId + ' ]: Non-existent command: ' + command.type + '.' );
					Logger.Error( JSON.stringify( command ) );
					break;
			}
		}
	}

	this.ChangePlayerMoveDir = function ( a_playerId, a_moveDir )
	{
		this.m_world[ a_playerId ].m_moveDir = a_moveDir;
		Logger.Info( 'Change [' + a_playerId + '] player dir to ' + JSON.stringify( a_moveDir ) );
	}

	this.ChangePlayerDirPoint = function ( a_playerId, a_dirPoint )
	{
		var player 			= this.m_world[ a_playerId ];
		player.m_dir		= Geometry.GetDirection( player.m_pos, a_dirPoint );
		player.m_dirPoint 	= a_dirPoint;

		this.m_updObjs[ a_playerId ] = player;
	}

	this.ChangePlayerDir = function ( a_player )
	{
		a_player.m_dir = Geometry.GetDirection( a_player.m_pos, a_player.m_dirPoint );

		this.m_updObjs[ a_player.m_id ] = a_player;
	}

	this.MovePlayerByOneAxis = function ( a_player, a_shift )
	{
		var maxIter = Collide.ITER_CNT;

		for ( var wallId in this.m_walls )
		{
			var wall 			= this.m_walls[ wallId ];
			var res  			= {};
			var iter 			= Collide.ITER_CNT + 1;
			var intersPointCnt 	= 0;
			do
			{
				--iter;
				intersPointCnt 	= 0;
				var factor = iter / Collide.ITER_CNT;
				var newPos = { m_x : a_player.m_pos.m_x + factor * Player.VEL * a_shift.m_x,
					   		   m_y : a_player.m_pos.m_y + factor * Player.VEL * a_shift.m_y };

				res =  Geometry.CircleRecIntersect( newPos, Player.RAD, wall );

				if ( res.m_intersect )
				{
					//Logger.Info( 'Wall : ' + wallId + '. Intersection detected. Iter : ' + iter + '. Points count : ' + res.m_pointsCnt );
					intersPointCnt = res.m_pointsCnt;
				}
			}
			while ( ( res.m_intersect !== false ) && ( intersPointCnt > 1 ) && ( iter > 1 ) )

			if ( iter <= 1 )
			{
				//Одна стена мешает перемещению - игрок остается на месте
				return;
			}
			else
			{
				//Собираем все "допустимые перемещения", из которых потом выберем наименьшее - случай, когда игрок находится вбилизи двух стен
				maxIter = Math.min( maxIter, iter );
			}
		}

		var factor 	 = maxIter / Collide.ITER_CNT;
		a_player.m_pos = { m_x : a_player.m_pos.m_x + factor * Player.VEL * a_shift.m_x,
					       m_y : a_player.m_pos.m_y + factor * Player.VEL * a_shift.m_y };
		this.m_updObjs[ a_player.m_id ] = a_player;
	}

	this.MovePlayer = function ( a_player, a_expiredTime )
	{
		var shift = { m_x : a_expiredTime * Player.VEL * a_player.m_moveDir.m_x,
					  m_y : a_expiredTime * Player.VEL * a_player.m_moveDir.m_y };

		if ( Geometry.IsNullVec( shift ) )
			return;

		//Пытаемся двигать по оси X
		this.MovePlayerByOneAxis( a_player, { m_x : shift.m_x, m_y : 0.0 } );

		//Пытаемся двигать по оси Y
		this.MovePlayerByOneAxis( a_player, { m_x : 0.0, m_y : shift.m_y } );

		this.ChangePlayerDir( a_player );

		Logger.Info( 'Shift [' + a_player.m_id + '] on vec ' + JSON.stringify( shift ) );
	}

	this.MovePlayers = function ( a_expiredTime )
	{
		for ( var id in this.m_players )
			this.MovePlayer( this.m_world[ id ], a_expiredTime );
	}

	this.SnapshotWorld = function ( a_currTime, a_currTick )
	{
		if ( this.m_snapshotObjList.length > SNAPSHOTS_CNT )
			this.m_snapshotObjList.shift();

		for ( var id in this.m_delObjs )
			delete this.m_world[ id ];

		this.m_snapshotObjList.push( {  m_time	   : a_currTime,
										m_tick 	   : a_currTick,
										m_addObjs  : jQuery.extend( true, {}, this.m_addObjs ),
										m_updObjs  : jQuery.extend( true, {}, this.m_updObjs ),
										m_delObjs  : jQuery.extend( true, {}, this.m_delObjs ),
									    m_snapshot : jQuery.extend( true, {}, this.m_world ) } );

	    this.m_addObjs  = {};
		this.m_updObjs	= {};
		this.m_delObjs	= {};
	}

	this.NextStep = function ( a_currTime, a_expiredTime, a_currTick )
	{
		this.MovePlayers( a_expiredTime );
		this.SnapshotWorld( a_currTime, a_currTick );
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
			teamId = 1;
		this.m_teams[ teamId ]++;

		var pos = jQuery.extend( false, {}, TeamsDeployPos[ teamId ] );
		var dir = jQuery.extend( false, {}, TeamsDir[ teamId ] );

		var player = { m_id     	: a_userId,
					   m_type   	: 'player',
					   m_teamId 	: teamId,
					   m_health		: Player.INIT_HEALTH,
					   m_pos 		: pos,
					   m_moveDir	: { m_x : 0.0, m_y : 0.0 },
					   m_dirPoint	: { m_x : pos.m_x + dir.m_x, m_y : pos.m_x + dir.m_x },
					   m_dir  		: dir };

		this.m_playerCommands[ a_userId ] 	= [];
		this.m_world[ a_userId ]   			= player;
		this.m_players[ a_userId ] 			= true;
		this.m_addObjs[ a_userId ] 			= player;
	}

	this.PlayerAlive = function( a_playerId )
	{
		return this.m_players[ a_playerId ] !== undefined;
	}

	this.DeletePlayer = function( a_playerId )
	{
		if ( this.m_world[ a_playerId ] === undefined )
			return;

		this.m_teams[ this.m_world[ a_playerId ].m_teamId ]--
		this.m_delObjs[ a_playerId ] = this.m_world[ a_playerId ];

		delete this.m_playerCommands[ a_playerId ];
		delete this.m_players[ a_playerId ];
		delete this.m_world[ a_playerId ];
	}

	this.GetWorldByTime = function ( a_time )
	{
		var leftBound  	= -1;
		var rightBound 	= -1;
		var lastInd 	= this.m_snapshotObjList.length - 1;

		if ( a_time > this.m_snapshotObjList[ lastInd ].m_time )
			return this.m_snapshotObjList[ lastInd ].m_snapshot;

		for ( var i = lastInd; i > 0; --i )
		{
			if ( ( this.m_snapshotObjList[ i - 1 ].m_time <= a_time ) && ( a_time <= this.m_snapshotObjList[ i ].m_time )  )
			{
				leftBound  = i - 1;
				rightBound = i;
				break;
			}
		}

		if ( ( a_time - this.m_snapshotObjList[ leftBound ].m_time ) <= ( this.m_snapshotObjList[ rightBound ].m_time - a_time ) )
			return this.m_snapshotObjList[ leftBound ].m_snapshot;

		return this.m_snapshotObjList[ rightBound ].m_snapshot;
	}

	this.ProcessAttack = function ( a_time, a_playerId, a_pos, a_point )
	{
		var world 		= this.GetWorldByTime( a_time );
		var player 		= world[ a_playerId ];
		var interObjs	= [];
		var res 		= { m_intersect : false };
		var dir 		= Geometry.GetDirection( a_pos, a_point );
		var closestObj  = {};

		for ( var id in world )
		{
			if ( id === a_playerId )
				continue;

			res.m_intersect = false;

			switch ( world[ id ].m_type )
			{
				case 'player' :
					if ( world[ id ].m_teamId === player.m_teamId )
						continue;
					res = Geometry.RayCircleIntersect( a_pos, dir, world[ id ].m_pos, Player.RAD );
					break;

				case 'wall' :
					res =  Geometry.RayRecIntersect( a_pos, dir, this.m_walls[ id ] );
					break;

				default :
					break;
			}

			if ( res.m_intersect )
			{
				var dist = Geometry.Dist( a_pos, res.m_point );

				if ( closestObj.m_id === undefined )
				{
					closestObj.m_id = id;
					closestObj.m_dist = dist;
				}
				else if ( dist + EPSILON < closestObj.m_dist )
				{
					closestObj = { m_id 	: id,
								   m_dist 	: dist };
				}
			}
		}

		if ( closestObj.m_id !== undefined )
		{
			if ( this.m_world[ closestObj.m_id ] === undefined )
				return;

			if ( this.m_world[ closestObj.m_id ].m_type === 'player' )
			{
				--this.m_world[ closestObj.m_id ].m_health;
				this.m_updObjs[ closestObj.m_id ] = this.m_world[ closestObj.m_id ];
			}

			if ( this.m_world[ closestObj.m_id ].m_health <= 0 )
				this.DeletePlayer( closestObj.m_id );
		}
	}

	//Debug
	this.TestIntersections = function ()
	{
		var wall = new Geometry.Rectangle( { m_x : 2.0, m_y : 2.0 }, 2.0, 2.0 );
		var res =  Geometry.RayRecIntersect( { m_x : 6.0, m_y : 4.0 }, { m_x : -1.0, m_y : 1.0 }, wall );

		//res =  Geometry.RayCircleIntersect( { m_x : 5.0, m_y : 1.0 }, { m_x : 0.0, m_y : 1.0 }, { m_x : 5.0, m_y : 7.0 }, 3.0 );

		//var res = Geometry.CircleRecIntersect( { m_x : 1.0, m_y : 1.0 }, 1.0, wall  )


		if ( res.m_intersect )
			Logger.Info( 'Intersection : ' + JSON.stringify( res ) );
	}
	//Debug

	this.m_currObjId		= 0;
	this.m_playersCnt		= 0;
	this.m_playerCommands	= {};
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
	this.InitTeams();

	//Ограничивающий прямоугольник
	this.m_walls[ this.GetUniqueId() ] = new Geometry.Rectangle( { m_x : MAP_WIDTH / 2.0, m_y : MAP_HEIGHT / 2.0 }, MAP_WIDTH, MAP_HEIGHT );

}

module.exports.CreateWorld = CreateWorld;