var jQuery = require( 'jquery' )	 

function InfLog( a_msg )
{
	console.log( new Date() + '[INF]: ' + a_msg );
}

function ErrLog( a_msg )
{
	console.log( new Date() + '[ERR]: ' + a_msg );	
}

function CreateGame()
{
	var SNAPSHOTS_CNT 			= 40; // sequence for 1000 / TICKS_INTERVAL * SNAPSHOTS_CNT seconds 
	
	//Map size
	var MAP_WIDTH				= 800;
	var MAP_HEIGHT				= 600;
		
	//Object width and height must be less than OBJ_SIZE
	var OBJ_SIZE				= 50;
	
	//Map size in cells
	var MAP_CELL_WIDTH			= MAP_WIDTH  / OBJ_SIZE;
	var MAP_CELL_HEIGHT			= MAP_HEIGHT / OBJ_SIZE;

	var OBJ_GENERATE_START_IND	= 1;
	var OBJ_GENERATE_END_IND	= MAP_WIDTH_CELL - 1;

	//1 by OBST_PROBABILITY
	var OBST_PROBABILITY		= 7;

	var TeamsEnum = { First  : 0,
					  Second : 1 };

	var ObjectEnum = { Player 	: 0,
						Wall	: 1,
						Bullet 	: 2 };
	
	var DeclareWorldObjects = function ()
	{
		START_HEALTH	= 100;

		Figures 		= { Rectangle : { m_index : 0, m_name : "rectangle" } }

		Obstacles   	= { Wall : { m_figure : Figures.Rectangle } };

		

		this.BULLET_VEL	= 50;

	  	OBST_CNT 		= Obstacles.length();
	}

	var GenerateMap = function ()
	{
		DeclareWorldObjects();

		this.m_map = new Array( MAP_CELL_WIDTH * MAP_CELL_HEIGHT );

		for ( var i = OBJ_GENERATE_START_IND; i < OBJ_GENERATE_END_IND; ++i )
		{
			for ( var j = 0; j < MAP_CELL_HEIGHT; ++j )
			{
				if ( Math.Random() % OBST_PROBABILITY == 0 )
				{
					var obj = Math.Random() % OBST_CNT;
					this.m_map[ i * OBJ_GENERATE_END_IND + j ] = obj;
					this.m_world.push( CreateObject( obj ) );
				}
				else
					this.m_map[ i * OBJ_GENERATE_END_IND + j ] = null;	
			}
		}
	}

	this.InitWorld = function ()
	{
		this.m_world 			= [];
		this.m_joiningPlayers	= [];
		this.m_players 			= [];		
		this.m_currObjId		= 0;	

		GenerateMap();

		this.m_snapshots.push( { m_tick : 0, m_snapshot : {} );
		this.m_snapshots.push( { m_tick : 1, m_snapshot : jQuery.extend( true, {}, this.m_world } );
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
		for ( var i = 0; i < this.m_world.length; ++i )
		{
			if ( this.m_world[ i ].m_type != ObjectEnum.Player )
				continue;

			var player = this.m_world[ i ];

			if ( player.m_commands.length != 0 )
			{
				for ( var command in player.m_commands[ i ] )
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

	var MovePlayer = function( a_playerInd, a_diff )
	{
		var player = this.m_world[ a_playerInd ];
			
		player.m_pos.m_x += a_diff.x;
		player.m_pos.m_y += a_diff.y;

		player.m_modTick = this.m_currTick;		
	}

	var CreateBullet = function ( a_playerId, a_pos, a_dir )
	{
		var pos = jQuery.extend( true, {}, a_pos );						
		var vel = { a_dir.m_x  * this.BULLET_VEL, a_dir.m_y * this.BULLET_VEL };
		
		var bullet = { m_type  : this.ObjectEnum.Bullet,
					   m_pos   : pos,
					   m_vel   : vel,
					   m_ownId : a_playerInd,
					   m_team  : this.m_world[ a_playerInd ].m_team };

		var bullId = this.GetUniqueId();
		this.m_world[ bullId ] = bullet;
		bullet.m_modTick = this.m_currTick;		
	}

	var MoveAllObjects = function ( a_expiredTime )
	{
		for ( int i = 0; i < this.m_world.length; ++i )
		{
			if ( this.m_world[ i ].m_vel === undefined )
				continue;

			var modObj = this.m_world[ i ];
			
			modObj.m_pos.m_x += a_expiredTime * modObj.m_vel.m_x;
			modObj.m_pos.m_y += a_expiredTime * modObj.m_vel.m_y;			

			modObj.m_modTick = this.m_currTick;
		}
	}

	var CollisionsDetect = function()
	{

	}
	
	var CreateSnapshot = function ( a_currTick )
	{
		if ( this.m_snapshots.length > SNAPSHOTS_CNT )
			this.m_snapshots.shift();

		this.m_snapshots.push( { m_tick : a_currTick, m_snapshot : jQuery.extend( true, {}, this.m_world } );
	}

	this.NextStep = function ( a_expiredTime, a_currTick )
	{
		this.m_currTick = a_currTick;

		ProcessAllInputs();

		MoveAllObjects();

		CollisionsDetect();

		CreteSnapshot( a_currTick );
	}

	this.GetSnapshotsDiff = function ( a_fromSnapshotTick, a_toSnapshotTick )
	{
		var firstSnapshot  = undefined;
		var secondSnapshot = undefined;
		var i = this.m_snapshots.length - 1;

		while ( ( i >= 0 ) && ( ( firstSnapshot === undefined ) || ( secondSnapshot === undefined ) ) )
			--i;

		if ( firstSnapshot === undefined )
			return secondSnapshot;
		
		diff = {}

		for ( var id in secondSnapshot )
		{
			if ( !( id in firstSnapshot ) )
				diff[ id ] = jQuery.extend( true, {}, secondSnapshot[ id ] );
			else if ( firstSnapshot[ key ].m_tick < secondSnapshot[ key ].m_tick )
				diff[ id ] = jQuery.extend( true, {}, secondSnapshot[ id ] );			
		}

		return diff;
	}

	this.CreatePlayer = function ()
	{
		var pos  = SelectPosForNewPlayer();
		var team = m_players.length % 2 == 0 ? TeamsEnum.FirstTeam : TeamsEnum.SecondTeam;

		var player = { m_pos : pos, m_team : team };		
	}

	this.AddNewPlayer = function ( a_userId )
	{
		var player 			= this.CreatePlayer();
		var playerWorldInd 	= this.m_world.push( player );
		var playerId 		= this.GetUniqueId();

		this.m_world[ playerId ] = player;
		player.m_modTick = this.m_currTick;
	}
}

exports.CreateGame = CreateGame;