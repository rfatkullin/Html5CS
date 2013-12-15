var jQuery   = require( 'jquery' );
var Geometry = require( './server_geometry.js' ).Geometry;
var Logger   = require( '../shared/logger' ).Logger;
var Commands = require( '../shared/commands' ).Commands;
var Player   = require( '../shared/constants' ).Player;
var Wall 	 = require( '../shared/constants' ).Wall;


var CreateWorld = function()
{
	var SNAPSHOTS_CNT 	= 40; // sequence for 1000 / TICKS_INTERVAL * SNAPSHOTS_CNT seconds
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

	this.SetPing = function ( a_ping )
	{
		this.m_ping = a_ping;
		Logger.Info( 'New ping: ' + a_ping );
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

	this.ProcessUserInput = function( a_userId, a_controlObj )
	{
		this.m_playerCommands[ a_userId ] = this.m_playerCommands[ a_userId ].concat( a_controlObj );
	}

	this.ProcessAllInputs = function()
	{
		for ( var id in this.m_playerCommands )
		{
			if ( this.m_playerCommands[ id ].length != 0 )
			{
				for ( var i = 0; i < this.m_playerCommands[ id ].length; ++i )
				{
					var command = this.m_playerCommands[ id ][ i ];

					switch ( command.type )
					{
						case Commands.ATTACK :

							this.ProcessAttack( id, command.pos, command.dir );
							break;

						case Commands.MOVE :

							this.MovePlayer( id, command.shift );
							break;

						case Commands.CHANGE_DIR :

							this.PlayerChangeDir( id, command.dir );
							break;

						default :

							Logger.Error( '[CL= ' + id + ' ]: Non-existent command: ' + command.type + '.' );
							Logger.Error( JSON.stringify( command ) );
							break;
					}
				}
			}

			this.m_playerCommands[ id ] = [];
		}
	}

	this.PlayerChangeDir = function ( a_playerInd, a_dir )
	{
		var player = this.m_world[ a_playerInd ];

		player.m_dir = a_dir;

		this.m_updObjs[ a_playerInd ] = player;
	}

	this.MovePlayerByOneAxis = function ( a_playerId, a_shift )
	{
		var player  = this.m_world[ a_playerId ];
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
				var newPos = { m_x : player.m_pos.m_x + factor * Player.VEL * a_shift.m_x,
					   		   m_y : player.m_pos.m_y + factor * Player.VEL * a_shift.m_y };

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
		player.m_pos = { m_x : player.m_pos.m_x + factor * Player.VEL * a_shift.m_x,
					     m_y : player.m_pos.m_y + factor * Player.VEL * a_shift.m_y };
		this.m_updObjs[ a_playerId ] = player;
	}

	this.MovePlayer = function ( a_playerId, a_shift )
	{
		//Пытаемся двигать по оси X
		this.MovePlayerByOneAxis( a_playerId, { m_x : a_shift.m_x, m_y : 0.0 } );

		//Пытаемся двигать по оси Y
		this.MovePlayerByOneAxis( a_playerId, { m_x : 0.0, m_y : a_shift.m_y } );
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
					this.DeletePlayer( id );
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
		}
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
					   m_health		: Player.INIT_HEALTH,
					   m_pos 		: pos,
					   m_dir  		: dir };

		this.m_playerCommands[ a_userId ] 	= [];
		this.m_world[ a_userId ]   			= player;
		this.m_players[ a_userId ] 			= true;
		this.m_addObjs[ a_userId ] 			= player;
	}

	this.DeletePlayer = function( a_playerId )
	{
		this.m_teams[ this.m_world[ a_playerId ].m_teamId ]--
		delete this.m_playerCommands[ a_playerId ];
		delete this.m_players[ a_playerId ];
	}

	this.ProcessAttack = function ( a_playerId, a_pos, a_dir )
	{
		var player 		= this.m_world[ a_playerId ];
		var interObjs	= [];
		var res 		= { m_intersect : false };

		for ( var id in this.m_world )
		{
			if ( id === a_playerId )
				continue;

			res.m_intersect = false;

			switch ( this.m_world[ id ].m_type )
			{
				case 'player' :
					if ( this.m_world[ id ].m_teamId === player.m_teamId )
						continue;
					res = Geometry.RayCircleIntersect( a_pos, a_dir, this.m_world[ id ].m_pos, Player.RAD );
					break;

				case 'wall' :
					res =  Geometry.RayRecIntersect( a_pos, a_dir, this.m_walls[ id ] );
					break;

				default :
					break;
			}

			if ( res.m_intersect )
			{
				var dist = Geometry.Dist( a_pos, res.m_point );
				interObjs.push( { m_id : id, m_dist : dist } );
			}
		}

		if ( interObjs.length > 0 )
		{
			for ( var i = 0; i < interObjs.length; ++i )
				Logger.Info( 'Intersection detected with: ' + interObjs[ i ].m_id );

			interObjs.sort( function( a_a, a_b )
							{
								return ( a_a.m_dist + Geometry.EPS < a_b.m_dist ? -1 : 1 );
							} );

			var interObj = interObjs[ 0 ];

			if ( this.m_world[ interObj.m_id ].m_type === 'player' )
				--this.m_world[ interObj.m_id ].m_health;
		}
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

	//Debug
	this.TestIntersections = function ()
	{
		var wall = new Geometry.Rectangle( { m_x : 3.0, m_y : 1.0 }, 2.0, 2.0 );
		// var res =  Geometry.RayRecIntersect( { m_x : 0.0, m_y : 1.0 }, { m_x : 3.0, m_y : 1.0 }, wall );

		//res =  Geometry.RayCircleIntersect( { m_x : 5.0, m_y : 1.0 }, { m_x : 0.0, m_y : 1.0 }, { m_x : 5.0, m_y : 7.0 }, 3.0 );

		var res = Geometry.CircleRecIntersect( { m_x : 1.0, m_y : 1.0 }, 1.0, wall  )


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
	this.m_walls[ this.GetUniqueId() ] = new Geometry.Rectangle( { m_x : MAP_WIDTH / 2.0, m_y : MAP_HEIGHT / 2.0 }, MAP_WIDTH, MAP_HEIGHT );

}

module.exports.CreateWorld = CreateWorld;