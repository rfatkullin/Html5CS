function World()
{
	var ownPlayerColor  	= [ 0.0, 1.0, 0.0, 0.3 ];
	var ourCommandColor 	= [ 0.0, 0.0, 1.0, 0.3 ];
	var opponenCommandColor = [ 1.0, 0.0, 0.0, 0.3 ];
	var wallColor			= [ 0.5, 0.5, 0.5, 1.0 ];
	var bulletColor			= [ 0.0, 0.0, 0.0, 1.0 ];
	var rtPlayerColor		= [ 0.0, 0.0, 0.0, 1.0 ];

	var Init = function ()
	{
		INTER_TIME	  = 75;
		SNAPSHOTS_CNT = 20;

		this.m_snapshotObjList 	= [];
	    this.m_state 			= { start : false, login : undefined };
	    //TO FIX: m_plyaer must be easier
	    this.m_player			= new Character( { m_x : 100.0, m_y : 100.0 } );
	    this.m_rtPlayer			= new Character( { m_x : 100.0, m_y : 100.0 } );
	    this.m_recvPlayer		= false;
	    this.m_wallDrawer		= new Rectangle( { m_x : 100, m_y : 100 }, Wall.WIDTH, Wall.HEIGHT );
	    this.m_playerDrawer		= new Circle( { m_x : 100, m_y : 100 }, Player.RAD + 5 );
	}

	this.DrawObjects = function ()
	{
		//InfLog( 'World to render : ' + JSON.stringify( this.m_renderWorld ) );

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
					currObj.Draw( bulletColor );
					break;

				default:
					break;
			}
		}
	}

	this.DrawCommonPlayer( a_player )
	{
		if ( a_player.m_id === this.m_player.m_id )
		{
			if ( !this.m_recvPlayer )
			{
				this.m_recvPlayer = true;
				this.m_rtPlayer.SetPos( a_player.m_pos );
			}

			this.DrawPlayer( a_player, ownPlayerColor );
		}
		else if ( a_player.m_teamId === this.m_player.m_teamId )
			this.DrawPlayer( a_player, ourCommandColor );
		else
			this.DrawPlayer( a_player, opponenCommandColor );
	}

	this.DrawPlayer = function ( a_player, a_color )
	{
		this.m_playerDrawer.SetPos( a_player.m_pos );
		this.m_playerDrawer.ChangeDirTo( a_player.m_dir );
		this.m_playerDrawer.Draw( a_color );
	}

	this.DrawWall = function ( a_pos )
	{
		this.m_wallDrawer.SetPos( a_pos );
		this.m_wallDrawer.Draw( wallColor );
	}

	this.Draw = function ()
	{
	    this.CreateWorldToDraw();
	    this.DrawObjects();

	    if ( this.m_recvPlayer )
	    	this.m_rtPlayer.Draw( rtPlayerColor );
	}

	this.ProcessUserInput = function ( a_shiftVec, a_mousePos )
	{
		this.m_player.ShiftOn( a_shiftVec );
		this.m_player.ChangeBarrelDirTo( a_mousePos );
	}

	this.MouseMove = function ( a_mousePos )
	{
		this.m_player.ChangeBarrelDirTo( a_mousePos );
	}

	this.CreateWorldToDraw = function ()
	{
		this.m_renderWorld = {};

		if ( this.m_snapshotObjList.length == 0 )
			return;

		var currTime 			= ( new Date() ).getTime();
		var renderTime 			= currTime - INTER_TIME;
		var lastSnapshotInd 	= this.m_snapshotObjList.length - 1;
		var leftBound			= -1;
		var rightBound			= -1;

		if (  this.m_snapshotObjList[ 0 ].m_timeStamp > renderTime )
		{
			//Waiting snapshots.
			InfLog( 'Too few snapshots.' );
			return;
		}

		if (  this.m_snapshotObjList[ lastSnapshotInd ].m_timeStamp < renderTime )
		{
			//Snapshot is lost -> extrapolating
			//Extrapolation();
			InfLog( 'Snapshots lost. Extraploation.' + 'Last snapshot time: ' + this.m_snapshotObjList[ lastSnapshotInd ].m_timeStamp + ' Render time: ' + renderTime );
			return;
		}

		for ( var i = lastSnapshotInd; i > 0; --i )
		{
			if ( ( this.m_snapshotObjList[ i - 1 ].m_timeStamp <= renderTime ) && ( renderTime <= this.m_snapshotObjList[ i ].m_timeStamp ) )
			{
				leftBound  = i - 1;
				rightBound = i;
			}
		}

		if ( ( leftBound < 0 ) || ( rightBound < 0 ) )
		{
			InfLog( 'Can\'t detect render position.' );
			return;
		}

		this.Interpolate( leftBound, rightBound, renderTime );
	}

	this.Interpolate = function ( a_leftBound, a_rightBound, a_renderTime )
	{
		var leftSnapShotObj  = this.m_snapshotObjList[ a_leftBound ];
		var rightSnapShotObj = this.m_snapshotObjList[ a_rightBound ];

		var interval = rightSnapShotObj.m_timeStamp - leftSnapShotObj.m_timeStamp;
		var factor   = ( a_renderTime - rightSnapShotObj.m_timeStamp ) / interval;

		this.m_renderWorld = jQuery.extend( true, {}, leftSnapShotObj.m_snapshot );

		for ( var upId in rightSnapShotObj.m_updated )
		{
			var startPos = this.m_renderWorld[ upId ].m_pos;
			var endPos   = rightSnapShotObj.m_snapshot[ upId ].m_pos;
			var interPos = { m_x : startPos.m_x + ( endPos.m_x - startPos.m_x ) * factor,
							 m_y : startPos.m_y + ( endPos.m_y - startPos.m_y ) * factor };

			this.m_renderWorld[ upId ].m_pos = interPos;
		}
	}

	this.Update = function ( a_updObj, a_timeStamp )
	{
		if ( !a_updObj.world.isDiff )
		{
			this.m_snapshotObjList = [];

			this.m_snapshotObjList.push( { 	m_tick      : a_updObj.m_tick,
									   		m_timeStamp : a_timeStamp,
									   		m_snapshot  : a_updObj.world.snapshot,
									   		m_updated	: {} } );

			InfLog( 'New world : ' + JSON.stringify( a_updObj.world.snapshot ) );

			return;
		}

		var diffObj = a_updObj.world.diff;

		var lastSnapshot = this.m_snapshotObjList[ this.m_snapshotObjList.length - 1 ].m_snapshot;

		var newSnapshot = jQuery.extend( true, {}, lastSnapshot );

		for ( var delId in diffObj.m_delObjs )
			delete newSnapshot[ delId ];

		for ( var upId in diffObj.m_updObjs )
			newSnapshot[ upId ] = diffObj.m_updObjs[ upId ];

		for ( var addId in diffObj.m_addObjs )
			newSnapshot[ addId ] = diffObj.m_addObjs[ addId ];

		if ( this.m_snapshotObjList.length > SNAPSHOTS_CNT )
			this.m_snapshotObjList.shift();

		this.m_snapshotObjList.push( { m_tick      : a_updObj.tick,
									   m_timeStamp : a_timeStamp,
									   m_snapshot  : newSnapshot,
									   m_updated   : Object.keys( diffObj.m_updObjs ) } );

		//InfLog( 'With diff : ' + JSON.stringify( diffObj ) );
	}

	Init.call( this );
}