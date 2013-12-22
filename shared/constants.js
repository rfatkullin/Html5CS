
(function ()
{
	Wall   = { 	WIDTH  : 40,
			  	HEIGHT : 40
			 };

	Player = { 	VEL 			: 15,
				RAD 			: 15,
				INIT_HEALTH		:  5,
    			BARREL_LENGTH 	: 20.0,
    			HEALTH_HEIGHT	:  2,
    			HEALTH_IND_OFFS :  5
    		 };

    Game   = { 	MSECS_IN_SEC : 1000 };

    Bullet = {  VEL : 500,
                RAD : 2
             };

	EPSILON = 0.000000001;

})()

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	module.exports = { Wall   	: Wall,
				  	   Player 	: Player,
				  	   EPSILON	: EPSILON,
				  	   Game		: Game };

