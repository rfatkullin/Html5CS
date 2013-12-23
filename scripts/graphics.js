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

function InitGL()
{
    canvas = document.getElementById( 'game-canvas' );

    if ( !canvas )
        alert( '[Error]: Can\'t find canvas element on page!' );

    try
    {
        gl = canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' );

        if ( !gl )
            alert( '[Error]: Can\'t retrieve webgl context!' );
    }
    catch( excp )
    {
        alert( '[Exc]: On retriving webgl context!' );
    }

    if ( gl === undefined )
        return;

    gl.viewportWidth  = canvas.width;
    gl.viewportHeight = canvas.height;
    
    var vertexShader   = GetShader( gl.VERTEX_SHADER, 'shader_vertex' );
    var fragmentShader = GetShader( gl.FRAGMENT_SHADER, 'shader_fragment' );

    g_graphics = { m_shaderProgram : gl.createProgram() };

    gl.attachShader( g_graphics.m_shaderProgram, vertexShader );
    gl.attachShader( g_graphics.m_shaderProgram, fragmentShader );

    gl.linkProgram( g_graphics.m_shaderProgram );

    if ( !gl.getProgramParameter( g_graphics.m_shaderProgram, gl.LINK_STATUS ) )
        alert( "[Error]: Can't link shaders!" );

    gl.useProgram( g_graphics.m_shaderProgram );

    g_graphics.m_shaderProgram.m_positionAttribute  = gl.getAttribLocation( g_graphics.m_shaderProgram, "a_pos" );
    g_graphics.m_shaderProgram.m_resolutionUniform  = gl.getUniformLocation( g_graphics.m_shaderProgram, "u_resolution" );
    g_graphics.m_shaderProgram.m_colorUniform       = gl.getUniformLocation( g_graphics.m_shaderProgram, "u_color");

    gl.uniform2f( g_graphics.m_shaderProgram.m_resolutionUniform , canvas.width, canvas.height );
}



