
(function ()
{
	Wall   = { 	WIDTH  : 40,
			  	HEIGHT : 40
			 };

	Player = { 	VEL 			: 15,
				RAD 			: 15,
				INIT_HEALTH		:  5,
    			BARREL_LENGTH 	: 20.0,
    			HEALTH_HEIGHT	:  2
    		 };

	Geometry = { EPSILON : 0.000000001 };

	Collide  = { ITER_CNT : 20 };

})()

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	module.exports = { Wall   	: Wall,
				  	   Player 	: Player,
				  	   Geometry : Geometry,
				  	   Collide  : Collide };

