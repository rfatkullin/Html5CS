(function ()
{
	Commands = { ATTACK 	: 0,
			 	 MOVE   	: 1,
			 	 DIR_CHANGE : 2 }

	CommandStruct = [ { m_vec : { m_x : 0.0, m_y : 0.0 } } ];

})()

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	module.exports = { Commands : Commands };