
(function ()
{
	Wall   = { 	WIDTH : 50,
			  	HEIGHT : 50
			 };

	Player = { 	VEL 			: 5,
				RAD 			: 15,
				INIT_HEALTH		: 100,
    			BARREL_LENGTH 	: 20.0
    		 };

	Geometry = { EPSILON : 0.000000001 };

	Collide  = { ITER_CNT : 20 };

})()

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	module.exports = { Wall   	: Wall,
				  	   Player 	: Player,
				  	   Geometry : Geometry,
				  	   Collide  : Collide };

