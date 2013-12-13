
(function ()
{
	Wall   = { 	WIDTH : 50,
			  	HEIGHT : 50
			 };

	Player = { 	VEL 			: 5,
				RAD 			: 15,
				INIT_HEALTH		: 100;
    			BARREL_LENGTH 	: 20.0
    		 };

	Bullet = { 	VEL : 100,
				RAD : 2
			 };

	Geometry = { EPSILON : 0.000000001 };

})()

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	module.exports = { Wall   	: Wall,
				  	   Player 	: Player,
				  	   Bullet 	: Bullet,
				  	   Geometry : Geometry };

