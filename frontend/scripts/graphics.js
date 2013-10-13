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

    g_graphics = { m_shaderProgram : gl.createProgram() };

    gl.attachShader( g_graphics.m_shaderProgram, vertexShader );
    gl.attachShader( g_graphics.m_shaderProgram, fragmentShader );

    gl.linkProgram( g_graphics.m_shaderProgram );

    if ( !gl.getProgramParameter( g_graphics.m_shaderProgram, gl.LINK_STATUS ) )
        alert( "[Error]: Can't link shaders!" );

    gl.useProgram( g_graphics.m_shaderProgram );

    g_graphics.m_shaderProgram.m_positionAttribute = gl.getAttribLocation( g_graphics.m_shaderProgram, "a_pos" );
    g_graphics.m_shaderProgram.m_resolutionUniform = gl.getUniformLocation( g_graphics.m_shaderProgram, "u_resolution" );

    gl.uniform2f( g_graphics.m_shaderProgram.m_resolutionUniform , canvas.width, canvas.height );
}

