
(function ()
{
	var dateObj = new Date();

	var GetTime = function ()
	{
		return dateObj.getHours() + ':' + dateObj.getMinutes() + ':' + dateObj.getSeconds() + ':' + dateObj.getMilliseconds();
	}

	InfLog = function ( a_msg )
	{
		console.log( GetTime() + '[INF]: ' + a_msg );
	}

	ErrLog = function ( a_msg )
	{
		console.log( GetTime() + '[ERR]: ' + a_msg );
	}
})()

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	module.exports.Logger = { Info : InfLog, Error : ErrLog };