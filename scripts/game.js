function GetShader( a_type, a_domId )
{
	var source = document.getElementById( a_domId ).innerHTML;
	var shader = gl.createShader( a_type );
	gl.shaderSource( shader, source );

	gl.compileShader( shader );

	if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) )
	{
		alert( "[Error]: Shader compilation error: " + gl.getShaderInfoLog( shader ) );
		gl.deleteShader( shader );
		return null;
	}

	return shader;
}

function InitShaders()
{
	var vertexShader   = GetShader( gl.VERTEX_SHADER, 'shader_vertex' );
	var fragmentShader = GetShader( gl.FRAGMENT_SHADER, 'shader_fragment' );

	shaderProgram = gl.createProgram();

	gl.attachShader( shaderProgram, vertexShader );
	gl.attachShader( shaderProgram, fragmentShader );

	gl.linkProgram( shaderProgram );

	if ( !gl.getProgramParameter( shaderProgram, gl.LINK_STATUS ) )
		alert( "[Error]: Can't link shaders!" );

	gl.useProgram( shaderProgram );
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation( shaderProgram, "aVertexPosition" );
	gl.enableVertexAttribArray( shaderProgram.vertexPositionAttribute );
}

//function InitScene()
//{
//    var vertices =[ 0.0,   0.0,  0.0,
//                    0.0,  5.0, 0.0,
//                    5.0,  5.0, 0.0,
//                    5.0,  0.0, 0.0];
//
//    var indices = [ 0, 1, 2, 0, 3, 2 ];
//
//    vertexBuffer = gl.createBuffer();
//    gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
//    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );
//	vertexBuffer.itemSize = 3;
//
//    indexBuffer = gl.createBuffer();
//    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, indexBuffer );
//    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );
//    indexBuffer.numberOfItems = indices.length;
//}

//function DrawScene()
//{
//    gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );
//    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
//    gl.clear( gl.COLOR_BUFFER_BIT );
//
//    gl.vertexAttribPointer( shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0 );
//    gl.drawElements( gl.LINE_LOOP, indexBuffer.numberOfItems, gl.UNSIGNED_SHORT, 0 );
//}

function InitCharacters()
{
    userCharacter = { m_vertexBuffer : gl.createBuffer(), m_figure : GeneratePointsForCircle() };

    SetCirclePos( userCharacter.m_figure, { m_x :100.0, m_y : 100.0 } );
    SetCircleRadius( userCharacter.m_figure, 100 );

    UpdateCharacterBuffer( userCharacter, userCharacter );
}

function UpdateCharacterBuffer( a_character )
{
    gl.bindBuffer( gl.ARRAY_BUFFER, a_character.m_vertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( a_character.m_figure.m_verts ), gl.STATIC_DRAW );

    var vertsStr = "Hello\nHello\n";

    for ( i = 0; i < a_character.m_figure.m_size * 2; i += 2 )
    {
        vertsStr += a_character.m_figure.m_verts[ i ] + " : " + a_character.m_figure.m_verts[ i + 1 ] + "\n"
    }
}

function DrawUserCharacter( a_character )
{
    gl.bindBuffer( gl.ARRAY_BUFFER, a_character.m_vertexBuffer );
    gl.vertexAttribPointer( shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0 );
    gl.drawArrays( gl.TRIANGLE_FAN, 0, a_character.m_figure.m_size * 2 );
}

function DrawScene()
{
    gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );

    DrawUserCharacter( userCharacter );
}

function GeneratePointsForCircle()
{
    const r             = 1.0;
    const VERTS_CNT     = 360;
    var angle           = 0.0;
    var angleStep       = Math.PI / VERTS_CNT;
    var startInd        = 2;

    var trian_verts = [ 0.0, 0.0 ];

    for ( i = 0; i < 2 * VERTS_CNT; i += 2 )
    {
        angle = i * angleStep;
        trian_verts[ startInd + i ]     = r * Math.cos( angle );
        trian_verts[ startInd + i + 1 ] = r * Math.sin( angle );
    }

    return { m_size: VERTS_CNT + 1, m_verts: trian_verts };
}

function SetCircleOffset( a_circle, a_pos )
{
    for ( i = 0; i < 2 * a_circle.m_size; i += 2 )
    {
        a_circle.m_verts[ i ]     += a_pos.m_x;
        a_circle.m_verts[ i + 1 ] += a_pos.m_y;
    }
}

function SetCirclePos( a_circle, a_pos )
{
    for ( i = 0; i < 2 * a_circle.size; i += 2 )
    {
        a_circle.m_verts[ i ]     = a_pos.m_x - a_circle.verts[ 0 ];
        a_circle.m_verts[ i + 1 ] = a_pos.m_y - a_circle.verts[ 1 ];
    }
}

function SetCircleRadius( a_circle, a_radius )
{
    var x = a_circle.m_verts[ 2 ] - a_circle.m_verts[ 0 ];
    var y = a_circle.m_verts[ 3 ] - a_circle.m_verts[ 1 ];
    var k = a_radius / Math.sqrt( x * x + y * y );

    for ( i = 0; i < 2 * a_circle.size; i += 2 )
    {
        a_circle.m_verts[ i ]     = k * ( a_circle.m_verts[ i ] - a_circle.m_verts[ 0 ] ) + a_circle.m_verts[ 0 ];
        a_circle.m_verts[ i + 1 ] = k * ( a_circle.m_verts[ i + 1 ] - a_circle.m_verts[ 1 ] ) + a_circle.m_verts[ 1 ];
    }
}

function StartGame()
{
	var canvas = document.getElementById( 'game-canvas' );

	if ( !canvas )
		alert( '[Error]: Can\'t find canvas element on page!' );

	try
	{
		gl = canvas.getContext( 'webgl' );

		if ( !gl )
			alert( '[Error]: Can\'t retrieve webgl context!' );
	}
	catch( excp )
	{
		alert( '[Excep]: On retriving webgl context!' );	
	}

	if ( gl )
	{
		gl.viewportWidth  = canvas.width;
		gl.viewportHeight = canvas.height;

		InitShaders();

        InitCharacters();

        setInterval( DrawScene, 500 );
	}
}