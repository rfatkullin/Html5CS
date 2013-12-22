var jQuery   		= require( 'jquery' );
var Geometry 		= require( './server_geometry.js' ).Geometry;
var Logger   		= require( '../shared/logger' ).Logger;
var Commands 		= require( '../shared/commands' ).Commands;
var Player   		= require( '../shared/constants' ).Player;
var Wall 	 		= require( '../shared/constants' ).Wall;
var EPSILON	 		= require( '../shared/constants' ).EPSILON;
var Game 			= require( '../shared/constants' ).Game;

var CreateWorld = function()
{
	var SNAPSHOTS_CNT 	= 66; // 2 sec
	var MAP_WIDTH		= 800;
	var MAP_HEIGHT		= 600;
	var ITER_CNT		= 20;

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
		this.m_updObjs[ a_playerId ] 		 = this.m_world[ a_playerId ];
		//Logger.Info( 'Change [' + a_playerId + '] player dir to ' + JSON.stringify( a_moveDir ) );
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

	this.CalcIterForWall = function ( a_player, a_wall, a_shift )
	{
		var iter = ITER_CNT + 1;

		do
    	{
            --iter;
            var factor = iter / ITER_CNT;
            var newPos = { m_x : a_player.m_pos.m_x + factor * Player.VEL * a_shift.m_x,
                           m_y : a_player.m_pos.m_y + factor * Player.VEL * a_shift.m_y };

            res =  Geometry.CircleRecIntersect( newPos, Player.RAD, a_wall );
        }
        while ( ( res.m_intersect !== false ) && ( res.m_pointsCnt > 1 ) && ( iter > 0 ) )

        return iter;
	}

	this.CalcIterForPlayer = function ( a_player, a_otherPos, a_shift )
	{
		var iter = ITER_CNT + 1;

		do
		{
			--iter;

			var factor = iter / ITER_CNT;
			var newPos = { m_x : a_player.m_pos.m_x + factor * Player.VEL * a_shift.m_x,
				   		   m_y : a_player.m_pos.m_y + factor * Player.VEL * a_shift.m_y };

			if ( Geometry.CircleCircleInter( newPos, Player.RAD, a_otherPos, Player.RAD ) === false )
				break;
		}
		while ( iter > 0 );

		return iter;
	}

	this.MovePlayerByOneAxis = function ( a_player, a_shift )
	{
		var maxIter = ITER_CNT;
		var iter = maxIter;

		for ( var id in this.m_world )
		{
			var intId = parseInt( id );

			switch ( this.m_world[ id ].m_type )
			{
				case 'wall' :
					iter = this.CalcIterForWall( a_player, this.m_walls[ id ], a_shift );
					break;

				case 'player' :
					if ( a_player.m_id === intId )
						continue;
					iter = this.CalcIterForPlayer( a_player, this.m_world[ id ].m_pos, a_shift );
					break;

				default :
					//beda
					break;
			}

			maxIter = Math.min( maxIter, iter );
		}

		maxIter = Math.min( maxIter, this.CalcIterForWall( a_player, this.m_boundWall, a_shift ) );

		if ( maxIter <= 0 )
			return;

		var factor 	 = maxIter / ITER_CNT;
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

		//Logger.Info( 'Shift [' + a_player.m_id + '] on vec ' + JSON.stringify( shift ) );
	}

 	this.IsOutOfField = function ( a_pos )
    {
        if ( ( a_pos.m_x < 0 || a_pos.m_x > MAP_WIDTH ) ||
             ( a_pos.m_y < 0 || a_pos.m_y > MAP_HEIGHT ) )
        	return true;

        return false;
    }

	this.DeleteBullet = function( a_bulletId )
	{
		if ( this.m_world[ a_bulletId ] === undefined )
			return;

		this.m_delObjs[ a_bulletId ] = this.m_world[ a_bulletId ];

		delete this.m_bullets[ a_bulletId ];
		delete this.m_world[ a_bulletId ];
	}

	this.MovePlayers = function ( a_expiredTime )
	{
		for ( var id in this.m_players )
			this.MovePlayer( this.m_world[ id ], a_expiredTime );
	}

	this.MoveBullets = function ( a_expiredTime )
	{
		for ( var id in this.m_bullets )
			this.MoveBullet( this.m_world[ id ], a_expiredTime );
	}

	this.MoveBullet = function ( a_bullet, a_expiredTime )
	{
		var moveVec = { m_x : a_expiredTime * a_bullet.m_vel.m_x,
					    m_y : a_expiredTime * a_bullet.m_vel.m_y };
		var newPos = { m_x : a_bullet.m_pos.m_x + moveVec.m_x,
					   m_y : a_bullet.m_pos.m_y + moveVec.m_y };

		if ( this.IsOutOfField( newPos ) === true )
        	this.DeleteBullet( a_bullet.m_id );
        else
        {
        	for ( var wallId in this.m_walls )
        	{
        		if( Geometry.SegInterOrInRec( a_bullet.m_pos, moveVec, this.m_walls[ wallId ] ).m_intersect === true )
        		{
        			this.DeleteBullet( a_bullet.m_id );
        			break;
        		}
        	}

		    for ( var playerId in this.m_players )
		    {
		    	if ( parseInt( playerId ) === a_bullet.m_ownerId )
		    		continue;

		    	if ( Geometry.SegInterOrInCircle( a_bullet.m_pos, moveVec, this.m_world[ playerId ].m_pos, Player.RAD ).m_intersect === true )
		    	{
		    		this.DeleteBullet( a_bullet.m_id );

		    		if ( this.m_world[ playerId ].m_teamId !== a_bullet.m_teamId )
		    			this.PlayerAttacked( playerId );

		    		break;
		    	}
		    }
		}

        this.m_updObjs[ a_bullet.m_id ] = a_bullet;
        a_bullet.m_pos = newPos;
	}

	this.SnapshotWorld = function ( a_currTime )
	{
		if ( this.m_snapshotObjList.length > SNAPSHOTS_CNT )
			this.m_snapshotObjList.shift();

		for ( var id in this.m_delObjs )
		{
			delete this.m_world[ id ];
			delete this.m_updObjs[ id ];
		}

		for ( var id in this.m_addObjs )
			delete this.m_updObjs[ id ];

		this.m_snapshotObjList.push( {  m_time	   : a_currTime,
										m_tick 	   : this.m_tick,
										m_addObjs  : jQuery.extend( true, {}, this.m_addObjs ),
										m_updObjs  : jQuery.extend( true, {}, this.m_updObjs ),
										m_delObjs  : jQuery.extend( true, {}, this.m_delObjs ),
									    m_snapshot : jQuery.extend( true, {}, this.m_world ) } );

	    this.m_addObjs  = {};
		this.m_updObjs	= {};
		this.m_delObjs	= {};
	}

	this.NextStep = function ( a_currTime, a_expiredTime )
	{
		++this.m_tick;

		this.MoveBullets( a_expiredTime );
		this.MovePlayers( a_expiredTime );

		this.SnapshotWorld( a_currTime );
	}

	this.GetWholeWorld = function ()
	{
		return this.m_snapshotObjList[ this.m_snapshotObjList.length - 1 ].m_snapshot;
	}

	this.GetSnapshotDiff = function ()
	{
		var lastInd = this.m_snapshotObjList.length - 1;

		return { m_addObjs : this.m_snapshotObjList[ lastInd ].m_addObjs,
				 m_updObjs : this.m_snapshotObjList[ lastInd ].m_updObjs,
				 m_delObjs : this.m_snapshotObjList[ lastInd ].m_delObjs };
	}

	this.FindPosForNewPlayer = function ()
	{
		var beginX 	= Player.RAD;
		var endX 	= MAP_WIDTH - Player.RAD;
		var beginY 	= Player.RAD;
		var endY	= MAP_HEIGHT - Player.RAD;
		var width  	= endX - beginX;
		var height 	= endY - beginY;
		var collide = false;

		do
		{
			collide = false;

			var pos = { m_x : beginX + Math.random() * width,
						m_y : beginY + Math.random() * height };

			for ( var id in this.m_world )
			{
				if ( ( ( this.m_world[ id ].m_type === 'wall' ) && ( Geometry.CircleInterOrInRec( pos, Player.RAD, this.m_walls[ id ] ) === true ) ) ||
					 ( ( this.m_world[ id ].m_type === 'player' ) && ( Geometry.CircleCircleInter( pos, Player.RAD, this.m_world[ id ].m_pos, Player.RAD ) === true ) ) )
				{
					Logger.Info( 'Player pos : ' + JSON.stringify( pos ) );
					Logger.Info( 'Wall object : ' + JSON.stringify( this.m_walls[ id ] ) );
					collide = true;
					break;
				}
			}
		}
		while ( collide === true )

		return pos;
	}

	this.AddNewPlayer = function ( a_userId )
	{
		var teamId = 0;

		if ( this.m_teams[ 0 ] > this.m_teams[ 1 ] )
			teamId = 1;
		this.m_teams[ teamId ]++;

		var pos = this.FindPosForNewPlayer();
		var dir = jQuery.extend( false, {}, TeamsDir[ teamId ] );

		var player = { m_id     	: a_userId,
					   m_type   	: 'player',
					   m_teamId 	: teamId,
					   m_health		: Player.INIT_HEALTH,
					   m_pos 		: pos,
					   m_moveDir	: { m_x : 0.0, m_y : 0.0 },
					   m_dirPoint	: { m_x : pos.m_x + dir.m_x, m_y : pos.m_x + dir.m_x },
					   m_dir  		: dir };

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

		delete this.m_players[ a_playerId ];
		delete this.m_world[ a_playerId ];
	}

	this.GetWorldIndexByTime = function ( a_time )
	{
		var lastInd = this.m_snapshotObjList.length - 1;

		if ( a_time > this.m_snapshotObjList[ lastInd ].m_time )
			return lastInd + 1;

		if ( a_time < this.m_snapshotObjList[ 0 ].m_time )
			return 0;

		for ( var i = lastInd; i > 0; --i )
		{
			if ( ( this.m_snapshotObjList[ i - 1 ].m_time <= a_time ) && ( a_time <= this.m_snapshotObjList[ i ].m_time )  )
				return i;
		}
	}

	this.BulletAndWorldIntersect = function ( a_playerId, a_segBegin, a_segVec, a_world )
	{
		var res 			= { m_intersect : false };
		var closestObj  	= {};

		for ( var id in a_world )
		{
			if ( parseInt( id ) === a_playerId )
				continue;

			res.m_intersect = false;

			switch ( a_world[ id ].m_type )
			{
				case 'player' :
					res =  Geometry.SegInterOrInCircle( a_segBegin, a_segVec, a_world[ id ].m_pos, Player.RAD );
					break;

				case 'wall' :
					res = Geometry.SegInterOrInRec( a_segBegin, a_segVec, this.m_walls[ id ] );
					break;

				default :
					break;
			}

			if ( res.m_intersect )
			{
				var dist = Geometry.Dist( a_segBegin, res.m_point );

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
			//Так как мы искали в прошлом, в текущем снэпшоте этого объекта может и не быть
			if ( this.m_world[ closestObj.m_id ] === undefined )
				return;

			if ( ( this.m_world[ closestObj.m_id ].m_type   === 'player' ) &&
				 ( this.m_world[ closestObj.m_id ].m_teamId !== this.m_world[ a_playerId ].m_teamId ) )
			{
				this.PlayerAttacked( closestObj.m_id );
			}

			return true;
		}

		return false;
	}

	this.PlayerAttacked = function ( a_playerId )
	{
		--this.m_world[ a_playerId ].m_health;
		this.m_updObjs[a_playerId ] = this.m_world[ a_playerId ];

		if ( this.m_world[ a_playerId ].m_health <= 0 )
			this.DeletePlayer( a_playerId );
	}

	this.ProcessAttack = function ( a_time, a_playerId, a_pos, a_point )
	{
		var startWorldInd 	= this.GetWorldIndexByTime( a_time );
		var player 			= this.m_world[ a_playerId ];
		var dir 			= Geometry.GetDirection( a_pos, a_point );
		var lastBegin		= { m_x : a_pos.m_x + dir.m_x * Player.BARREL_LENGTH,
		            			m_y : a_pos.m_y + dir.m_y * Player.BARREL_LENGTH }
		var lastTime		= a_time;
		var collide 		= false;

		for ( var i = startWorldInd; i < this.m_snapshotObjList.length; ++i )
		{
			var timeInt = ( this.m_snapshotObjList[ i ].m_time - lastTime ) / Game.MSECS_IN_SEC;
			var segVec = { m_x : timeInt * Bullet.VEL * dir.m_x,
						   m_y : timeInt * Bullet.VEL * dir.m_y };

			if ( this.BulletAndWorldIntersect( a_playerId, lastBegin, segVec, this.m_snapshotObjList[ i ].m_snapshot ) )
			{
				collide = true;
				break;
			}

			lastTime = this.m_snapshotObjList[ i ].m_time;
			lastBegin = { m_x : lastBegin.m_x + segVec.m_x,
						  m_y : lastBegin.m_y + segVec.m_y };
		}

		if ( collide )
			return;

		//Если дошли сюда, то пуля все еще существует. Добавляем ее в последний мир.
		//lastBegin будет содержать актуальную позицию
		this.AddNewBullet( a_playerId, lastBegin, dir );
	}

	this.AddNewBullet = function ( a_playerId, a_pos, a_dir )
	{
		var vel = { m_x : a_dir.m_x * Bullet.VEL,
		            m_y : a_dir.m_y * Bullet.VEL };

		var bullet = { m_id     	: this.GetUniqueId(),
                       m_type   	: 'bullet',
                       m_pos    	: a_pos,
                       m_ownerId 	: a_playerId,
                       m_vel    	: vel,
                       m_teamId 	: this.m_world[ a_playerId ].m_teamId };

		this.m_world[ bullet.m_id ]   = bullet;
		this.m_bullets[ bullet.m_id ] = true;
		this.m_addObjs[ bullet.m_id ] = bullet;
	}

	//For unique keys
	this.m_currObjId		= 0;
	this.m_tick				= 0;
	this.m_world    		= {};
	this.m_addObjs  		= {};
	this.m_updObjs			= {};
	this.m_delObjs			= {};
	this.m_snapshotObjList 	= []
	this.m_teams			= [ 0, 0 ];

	this.m_walls 			= {};
	this.m_players 			= {};
	this.m_bullets			= {};

	this.GenerateMap();
	this.InitTeams();

	//Ограничивающий прямоугольник
	this.m_boundWall = new Geometry.Rectangle( { m_x : MAP_WIDTH / 2.0, m_y : MAP_HEIGHT / 2.0 }, MAP_WIDTH, MAP_HEIGHT );

}

module.exports.CreateWorld = CreateWorld;