function World()
{
	var ownPlayerColor  	= [ 0.0, 1.0, 0.0, 0.3 ];
	var ourCommandColor 	= [ 0.0, 0.0, 1.0, 0.3 ];
	var opponenCommandColor = [ 1.0, 0.0, 0.0, 0.3 ];
	var wallColor			= [ 0.5, 0.5, 0.5, 1.0 ];
	var bulletColor			= [ 0.0, 0.0, 0.0, 1.0 ];

	var Init = function ()
	{  			
		this.m_snapshotObjList 	= [];
	    this.m_state 			= { start : false, login : undefined };	    
	    this.m_player 			= new Character( { m_x : 100.0, m_y : 100.0 } );
	    this.m_background 		= new Background();	    
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
					if ( currObj.m_id === this.m_plyaer.m_id )
						currObj.Draw( ownPlayerColor );
					else if ( currObj.m_teamId === this.m_player.m_teamId )
						currObj.Draw( ourCommandColor );
					else
						currObj.Draw( opponenCommandColor );
					break;

				case 'wall' :
					currObj.Draw( wallColor );
					break;					

				case 'bullet' :
					currObj.Draw( bulletColor );					
					break;

				default:
					break;
			}
		}
	}

	this.Draw = function ()
	{
	    gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );
	    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
	    gl.clear( gl.COLOR_BUFFER_BIT );

	    this.m_background.Draw();	    
	    this.CreateWorldToDraw();
	    this.DrawObjects();
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
		var renderTime 			= currTime - this.INTER_TIME;		
		var lastSnapshotInd 	= this.m_snapshotsList.length - 1;
		var leftBound			= -1;
		var rightBound			= -1;
		
		if (  this.m_snapshotsList[ 0 ].m_timeStamp > renderTime )
		{
			//Waiting snapshots.
			return;
		}

		if (  this.m_snapshotsList[ lastSnapshotInd ].m_timeStamp < renderTime )
		{
			//Snapshot is lost -> extrapolating
			//Extrapolation();
			return;
		}

		for ( var ind = lastSnapshotInd; i > 0; --i )
		{
			if ( ( this.m_snapshotsList[ i - 1 ].m_timeStamp <= renderTime ) && ( renderTime <= this.m_snapshotsList[ i ].m_timeStamp ) )
			{
				leftBound  = i - 1;
				rightBound = i; 
			}
		}

		Interpolate( leftBound, rightBound, renderTime );
	}

	this.Interpolate = function ( a_leftBound, a_rightBound, a_renderTime )
	{
		this.m_renderWorld = {};

		var leftSnapShotObj  = this.m_snapshotObjList[ a_leftBound ];
		var rightSnapShotObj = this.m_snapshotObjList[ a_rightBound ];

		var interval = rightSnapShotObj.m_timeStamp - leftSnapShotObj.m_timeStamp;  
		var factor   = ( a_renderTime - rightSnapShotObj.m_timeStamp ) / interval;

		this.m_renderWorld = jQuery( true, {}, leftSnapShotObj.m_snapshot );

		for ( var upId in rightSnapShotObj.m_updatedIds )
		{
			var startPos = renderWorld[ upId ].m_pos;  
			var endPos   = rightSnapShotObj.m_snapshot[ upId ].m_pos;
			var interPos = { m_x : startPos.m_x + ( endPos.m_x - startPos.m_x ) * factor,
							 m_y : startPos.m_y + ( endPos.m_y - startPos.m_y ) * factor };

			this.m_renderWorld[ upId ].m_pos = interPos;
		}
	}

	this.Update = function ( a_diff, a_timeStamp )
	{
		var newSnapshot = jQuery.extend( true, {}, this.m_snapshotObjList[ m_snapshotObjList.length - 1 ].m_snapshot );
		
		for ( var delId in a_diff.m_deleted )
			delete newSnapshot[ delId ];

		for ( var upId in a_diff.m_updated )
			newSnapshot[ upId ] = jQuery.extend( true, {}, a_diff.m_updated[ upId ] );

		for ( var addId in a_diff.m_added )
			newSnapshot[ addId ] = jQuery.extend( true, {}, a_diff.m_added[ addId ] );

		if ( m_snapshotObjList.length > SNAPSHOTS_CNT )
			m_snapshotObjList.shift();

		var updatedIds = {};

		for ( var ids in a_diff.m_updated )
			updatedIds[ ids ] = 'present';

		this.m_snapshotObjList.push( { m_tick      : a_diff.m_tick,
									   m_timeStamp : a_diff.a_timeStamp,
									   m_snapshot  : newSnapshot,
									   m_updated	  : updatedIds } );
	}

	Init.apply( this );
}