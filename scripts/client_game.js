function CreateGame()
{
	var ownPlayerColor  	= [ 0.0, 1.0, 0.0, 0.3 ];
	var ourCommandColor 	= [ 0.0, 0.0, 1.0, 0.3 ];
	var enemyCommandColor 	= [ 1.0, 0.0, 0.0, 0.3 ];
	var wallColor			= [ 0.5, 0.0, 1.0, 1.0 ];
	var bulletColor         = [ 0.0, 0.0, 0.0, 1.0 ];
	var healthColor			= [ 0.0, 0.5, 0.0, 1.0 ];

	this.SetPlayerInfo = function ( a_id )
	{
		this.m_playerId = a_id;
	}

	this.GetPlayerPos = function ()
	{
		return this.m_renderWorld[ this.m_playerId ].m_pos;
	}

	this.DrawObjects = function ()
	{
		var currObj;

		for ( var key in this.m_renderWorld )
		{
			currObj = this.m_renderWorld[ key ];

			switch ( currObj.m_type )
			{
				case 'player' :
					this.DrawCommonPlayer( currObj );
					break;

				case 'wall' :
					this.DrawWall( currObj.m_pos );
					break;

				case 'bullet' :
                    this.DrawBullet( currObj.m_pos );
                    break;

				default:
					break;
			}
		}
	}

	this.DrawCommonPlayer = function ( a_player )
	{
		if ( a_player.m_id === this.m_playerId )
			this.DrawPlayer( a_player, ownPlayerColor );
		else if ( a_player.m_teamId === this.m_renderWorld[ this.m_playerId ].m_teamId )
			this.DrawPlayer( a_player, ourCommandColor );
		else
			this.DrawPlayer( a_player, enemyCommandColor );

		this.DrawPlayerHealth( a_player );
	}

	this.DrawPlayer = function ( a_player, a_color )
	{
		this.m_playerDrawer.SetPos( a_player.m_pos );
		this.m_playerDrawer.ChangeDir( a_player.m_dir );
		this.m_playerDrawer.Draw( a_color );
	}

	this.DrawWall = function ( a_pos )
	{
		this.m_wallDrawer.SetPos( a_pos );
		this.m_wallDrawer.Draw( wallColor );
	}

	this.DrawBullet = function ( a_pos )
    {
        this.m_bulletDrawer.SetPos( a_pos );
        this.m_bulletDrawer.Draw( bulletColor );

        //InfLog( 'Draw bullet on ' + JSON.stringify( a_pos ) );
    }

	this.Draw = function ()
	{
	    if ( ( this.CreateWorldToDraw() ) && ( this.m_renderWorld[ this.m_playerId ] !== undefined ) )
	    	this.DrawObjects();
	}

	this.DrawPlayerHealth = function ( a_player )
	{
		var width = ( a_player.m_health / Player.INIT_HEALTH ) * ( 2.0 * Player.RAD );
		var pos = { m_x : a_player.m_pos.m_x - Player.RAD + width / 2.0,
					m_y : a_player.m_pos.m_y - Player.RAD - Player.HEALTH_IND_OFFS };

		var rec = new Rectangle( pos, width, Player.HEALTH_HEIGHT );

		rec.Draw( healthColor );
	}

	this.CreateWorldToDraw = function ()
	{
		this.m_renderWorld = {};

		if ( this.m_snapshotObjList.length == 0 )
			return;

		var currTime 			= ( new Date() ).getTime();
		var renderTime 			= currTime - this.INTER_TIME;
		var lastSnapshotInd 	= this.m_snapshotObjList.length - 1;
		var leftBound			= -1;
		var rightBound			= -1;

		if (  this.m_snapshotObjList[ 0 ].m_timeStamp > renderTime )
		{
			//Waiting snapshots.
			InfLog( 'Too few snapshots.' );
			return false;
		}

		if ( this.m_snapshotObjList[ lastSnapshotInd ].m_timeStamp < renderTime )
		{
			this.Extrapolate( renderTime );
			InfLog( 'Extraploation: ' + ( renderTime - this.m_snapshotObjList[ lastSnapshotInd ].m_timeStamp ) / Game.MSECS_IN_SEC );
			this.m_lastExtrapolVal = ( renderTime - this.m_snapshotObjList[ lastSnapshotInd ].m_timeStamp ) / Game.MSECS_IN_SEC;
			this.m_extrapolVal += this.m_lastExtrapolVal;
			++this.m_extrapolCount;
			return true;
		}

		for ( var i = lastSnapshotInd; i > 0; --i )
		{
			for ( var j = i - 1; j >= 0; --j )
			{
				if ( ( this.m_snapshotObjList[ j ].m_timeStamp <= renderTime ) && ( renderTime <= this.m_snapshotObjList[ i ].m_timeStamp ) )
				{
					leftBound  = j;
					rightBound = i;
					break;
				}
			}
		}

		if ( ( leftBound < 0 ) || ( rightBound < 0 ) )
		{
			InfLog( 'Can\'t detect render position.' );
			return false;
		}

		this.Interpolate( leftBound, rightBound, renderTime );

		return true;
	}

	this.Extrapolate = function ( a_renderTime )
	{
		var lastSnapshotObj = this.m_snapshotObjList[ this.m_snapshotObjList.length - 1 ];
		var expiredTime = ( a_renderTime - lastSnapshotObj.m_timeStamp ) / Game.MSECS_IN_SEC;
		this.m_renderWorld = jQuery.extend( true, {}, lastSnapshotObj.m_snapshot );

		for ( var id in this.m_renderWorld )
		{
			var currObj = this.m_renderWorld[ id ];
			if ( currObj.m_type === 'player' )
			{
				currObj.m_pos = { m_x : currObj.m_pos.m_x + expiredTime * Player.VEL * currObj.m_moveDir.m_x,
							      m_y : currObj.m_pos.m_y + expiredTime * Player.VEL * currObj.m_moveDir.m_y };
			}
		}
	}

	this.InterpolatePos = function ( a_startPos, a_endPos, a_factor )
	{
		return { m_x : a_startPos.m_x + ( a_endPos.m_x - a_startPos.m_x ) * a_factor,
				 m_y : a_startPos.m_y + ( a_endPos.m_y - a_startPos.m_y ) * a_factor };
	}

	this.InterpolateDir = function ( a_startDir, a_endDir, a_factor )
	{
		var rightRotate = false;
		var pseudoScalar = a_startDir.m_x * a_endDir.m_y - a_startDir.m_y * a_endDir.m_x;

		if ( pseudoScalar < EPSILON )
			rightRotate = true;

		var angle = Math.acos( a_startDir.m_x * a_endDir.m_x + a_startDir.m_y * a_endDir.m_y );
		var middleAngle = a_factor * angle * ( rightRotate ? -1 : 1 );

		var cosVal = Math.cos( middleAngle );
		var sinVal = Math.sin( middleAngle );

		var x = a_startDir.m_x * cosVal - a_startDir.m_y * sinVal;
		var y = a_startDir.m_x * sinVal + a_startDir.m_y * cosVal;

		return { m_x : x, m_y : y };
	}

	this.Interpolate = function ( a_leftBound, a_rightBound, a_renderTime )
	{
		var leftSnapShotObj  = this.m_snapshotObjList[ a_leftBound ];
		var rightSnapShotObj = this.m_snapshotObjList[ a_rightBound ];

		var interval = rightSnapShotObj.m_timeStamp - leftSnapShotObj.m_timeStamp;
		var factor   = ( a_renderTime - leftSnapShotObj.m_timeStamp ) / interval;

		this.m_renderWorld = jQuery.extend( true, {}, leftSnapShotObj.m_snapshot );

		//Удаление объектов, которых нет в текущем "снэпшоте"
		for ( var delId, i = 0; i < leftSnapShotObj.m_deleted.length; ++i )
		{
			delId = leftSnapShotObj.m_deleted[ i ];
			delete this.m_renderWorld[ delId ];
		}

		for ( i = 0; i < rightSnapShotObj.m_updated.length; ++i )
		{
			var upId = rightSnapShotObj.m_updated[ i ];

			this.m_renderWorld[ upId ].m_pos = this.InterpolatePos( leftSnapShotObj.m_snapshot[ upId ].m_pos,
																	rightSnapShotObj.m_snapshot[ upId ].m_pos,
																	factor );

			if ( this.m_renderWorld[ upId ].m_type === 'player' )
			{
				this.m_renderWorld[ upId ].m_dir = this.InterpolateDir( leftSnapShotObj.m_snapshot[ upId ].m_dir,
			 	   				 			   							rightSnapShotObj.m_snapshot[ upId ].m_dir,
			 	 				 			   							factor );
			}
		}
	}

	this.GetExtrapolationInfo = function ()
	{
		var aver = 0;
		var last = 0;

		if ( this.m_extrapolCount !== 0 )
			aver = this.m_extrapolVal / this.m_extrapolCount;

		last = this.m_lastExtrapolVal;

		this.m_extrapolVal = 0;
		this.m_extrapolCount = 0;

		return { m_aver : aver, m_last : last };
	}

	this.Update = function ( a_updObj )
	{
		if ( !a_updObj.world.isDiff )
		{
			this.m_snapshotObjList = [];

			this.m_snapshotObjList.push( { 	m_timeStamp : ( new Date() ).getTime(),
									   		m_snapshot  : a_updObj.world.snapshot,
									   		m_updated	: {},
									   		m_deleted	: {} } );

			//InfLog( 'New world : ' + JSON.stringify( a_updObj.world.snapshot ) );

			return;
		}

		var diffObj = a_updObj.world.diff;

		var lastSnapshotObj = this.m_snapshotObjList[ this.m_snapshotObjList.length - 1 ];

		var newSnapshot = $.extend( true, {}, lastSnapshotObj.m_snapshot );

		for ( var delId, i = 0; i < lastSnapshotObj.m_deleted.length; ++i )
		{
			delId = lastSnapshotObj.m_deleted[ i ];
			delete newSnapshot[ delId ];
		}

		for ( var upId in diffObj.m_updObjs )
			newSnapshot[ upId ] = diffObj.m_updObjs[ upId ];

		for ( var addId in diffObj.m_addObjs )
			newSnapshot[ addId ] = diffObj.m_addObjs[ addId ];

		if ( this.m_snapshotObjList.length > this.SNAPSHOTS_CNT )
			this.m_snapshotObjList.shift();

		this.m_snapshotObjList.push( { m_timeStamp : ( new Date() ).getTime(),
									   m_snapshot  : newSnapshot,
									   m_updated   : Object.keys( diffObj.m_updObjs ),
									   m_deleted   : Object.keys( diffObj.m_delObjs ) } );

		//InfLog( 'With diff : ' + JSON.stringify( diffObj ) + ' Keys : ' + JSON.stringify( Object.keys( diffObj.m_updObjs ) ) );
	}

	this.SNAPSHOTS_CNT = 66;

	this.m_snapshotObjList 	= [];
    this.m_state 			= { start : false, login : undefined };
    this.m_playerId			= -1;
    this.m_playerDrawer		= new Character( { m_x : 100.0, m_y : 100.0 } );
    this.m_wallDrawer		= new Rectangle( { m_x : 100, m_y : 100 }, Wall.WIDTH, Wall.HEIGHT );
    this.m_bulletDrawer     = new Circle( { m_x : 100, m_y : 100 }, Bullet.RAD );
    this.m_extrapolVal 		= 0;
    this.m_extrapolCount 	= 0;
    this.m_lastExtrapolVal  = 0;
    this.INTER_TIME 		= 0;
}