
(function ()
{
	Wall   = { WIDTH : 50, HEIGHT : 50 };
	Player = { VEL : 5, RAD : 25 };

})()

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	module.exports = { Wall   : Wall,
				  	   Player : Player };

