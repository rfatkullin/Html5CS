(function ()
{
	Commands = { ATTACK 			: 0,
			 	 MOVE   			: 1,
			 	 CHANGE_MOVE_DIR	: 2,
			 	 CHANGE_DIR 		: 3 }

	CommandStruct = [ { m_vec : { m_x : 0.0, m_y : 0.0 } } ];

})()

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	module.exports = { Commands : Commands };