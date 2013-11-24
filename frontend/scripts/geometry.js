function Vector( a_posX, a_posY )
{
    this.m_x = a_posX;
    this.m_y = a_posY;
}

function Circle( a_pos, a_radius )
{
    var GenerateCirclePoints = function ()
    {
        const VERTS_CNT     = 50;
        var angle           = 0.0;
        var angleStep       = Math.PI / ( VERTS_CNT - 1 );
        var startInd        = 2;

        this.m_verts = [ a_pos.m_x, a_pos.m_y ];

        for ( i = 0; i < 2 * VERTS_CNT; i += 2 )
        {
            angle = i * angleStep;
            this.m_verts[ startInd + i ]     = a_pos.m_x + a_radius * Math.cos( angle );
            this.m_verts[ startInd + i + 1 ] = a_pos.m_y + a_radius * Math.sin( angle );
        }

        this.m_size  = VERTS_CNT + 1;
    }

    var Init = function ()
    {
        GenerateCirclePoints.call( this );
        this.m_vertBuff = gl.createBuffer();
    }

    this.ShiftOn = function ( a_pos )
    {
        for ( i = 0; i < 2 * this.m_size; i += 2 )
        {
            this.m_verts[ i ]     += a_pos.m_x;
            this.m_verts[ i + 1 ] += a_pos.m_y;
        }
    }

    this.SetPos = function ( a_pos )
    {
        var centerX = this.m_verts[ 0 ];
        var centerY = this.m_verts[ 1 ];

        for ( i = 0; i < 2 * this.m_size; i += 2 )
        {
            this.m_verts[ i ]     += a_pos.m_x - centerX;
            this.m_verts[ i + 1 ] += a_pos.m_y - centerY;
        }
    }

    this.SetRadius = function( a_radius )
    {
        var centerX = this.m_verts[ 0 ];
        var centerY = this.m_verts[ 1 ];
        var x = this.m_verts[ 2 ] - this.m_verts[ 0 ];
        var y = this.m_verts[ 3 ] - this.m_verts[ 1 ];
        var k = a_radius / Math.sqrt( x * x + y * y );

        for ( i = 0; i < 2 * this.m_size; i += 2 )
        {
            this.m_verts[ i ]     = k * ( this.m_verts[ i ] - centerX ) + centerX;
            this.m_verts[ i + 1 ] = k * ( this.m_verts[ i + 1 ] - centerY ) + centerY;
        }
    }

    this.Draw = function( a_color )
    {
        gl.uniform4fv( g_graphics.m_shaderProgram.m_colorUniform, a_color );
        gl.bindBuffer( gl.ARRAY_BUFFER, this.m_vertBuff );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( this.m_verts ), gl.STATIC_DRAW );
        gl.enableVertexAttribArray( g_graphics.m_shaderProgram.m_positionAttribute );
        gl.vertexAttribPointer( g_graphics.m_shaderProgram.m_positionAttribute, 2, gl.FLOAT, false, 0, 0 );
        gl.drawArrays( gl.TRIANGLE_FAN, 0, this.m_size );
    }

    Init.call( this );
}

function Rectangle( a_pos, a_width, a_height )
{
    var GenerateRectanglePoints = function()
    {
        this.m_verts = [ a_pos.m_x - a_width / 2.0, a_pos.m_y + a_height / 2.0,
                         a_pos.m_x + a_width / 2.0, a_pos.m_y + a_height / 2.0,
                         a_pos.m_x + a_width / 2.0, a_pos.m_y - a_height / 2.0,
                         a_pos.m_x - a_width / 2.0, a_pos.m_y - a_height / 2.0 ];

        this.m_size = 4;
        this.m_pos  = $.extend( false, {}, a_pos );
    }

    var Init = function ()
    {
        GenerateRectanglePoints.call( this );
        this.m_vertBuff = gl.createBuffer();
    }

    this.ShiftOn = function ( a_pos )
    {
        for ( var i = 0; i < 2 * this.m_size; i += 2 )
        {
            this.m_verts[ i ]     += a_pos.m_x;
            this.m_verts[ i + 1 ] += a_pos.m_y;
        }

        this.m_pos.m_x += a_pos.m_x;
        this.m_pos.m_y += a_pos.m_y;
    }

    this.SetPos = function ( a_pos )
    {
        for ( var i = 0; i < 2 * this.m_size; i += 2 )
        {
            this.m_verts[ i ]     += a_pos.m_x - this.m_pos.m_x;
            this.m_verts[ i + 1 ] += a_pos.m_y - this.m_pos.m_y;
        }

        this.m_pos = $.extend( false, {}, a_pos );
    }

    this.Draw = function()
    {
        gl.bindBuffer( gl.ARRAY_BUFFER, this.m_vertBuff );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( this.m_verts ), gl.STATIC_DRAW );
        gl.enableVertexAttribArray( g_graphics.m_shaderProgram.m_positionAttribute );
        gl.vertexAttribPointer( g_graphics.m_shaderProgram.m_positionAttribute, 2, gl.FLOAT, false, 0, 0 );
        gl.drawArrays( gl.TRIANGLE_FAN, 0, this.m_size );
    }

    Init.call( this );
}


function Line( a_begin, a_end, a_length )
{
    var Init = function()
    {
        this.m_length = a_length;

        this.m_verts = [ a_begin.m_x, a_begin.m_y,
                         a_end.m_x,   a_end.m_y ];

        this.m_size = 2;
        this.m_vertBuff = gl.createBuffer();
    }

    this.ShiftOn = function ( a_pos )
    {
        for ( var i = 0; i < 2 * this.m_size; i += 2 )
        {
            this.m_verts[ i ]     += a_pos.m_x;
            this.m_verts[ i + 1 ] += a_pos.m_y;
        }
    }

    this.SetPos = function ( a_pos )
    {
        this.m_verts[ 2 ] += a_pos.m_x - this.m_verts[ 0 ];
        this.m_verts[ 3 ] += a_pos.m_y - this.m_verts[ 1 ];

        this.m_verts[ 0 ] = a_pos.m_x;
        this.m_verts[ 1 ] = a_pos.m_y
    }

    this.Draw = function ( a_color )
    {
        gl.lineWidth( 1.0 );
        gl.getParameter( gl.ALIASED_LINE_WIDTH_RANGE );
        gl.uniform4fv( g_graphics.m_shaderProgram.m_colorUniform, a_color );
        gl.bindBuffer( gl.ARRAY_BUFFER, this.m_vertBuff );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( this.m_verts ), gl.STATIC_DRAW );
        gl.enableVertexAttribArray( g_graphics.m_shaderProgram.m_positionAttribute );
        gl.vertexAttribPointer( g_graphics.m_shaderProgram.m_positionAttribute, 2, gl.FLOAT, false, 0, 0 );
        gl.drawArrays( gl.LINES, 0, this.m_size );
    }

    this.ChangeDir = function ( a_dir )
    {
       this.m_verts[ 2 ] = this.m_verts[ 0 ] + a_dir.m_x * this.m_length;
       this.m_verts[ 3 ] = this.m_verts[ 1 ] + a_dir.m_y * this.m_length;
    }

    Init.call( this );
}

function Triangle( a_pos )
{
    this.m_verts = [ 100.0, 100.0, 200.0, 100.0, 150.0, 150.0  ];
    this.m_size  = 3;
}

function NormalizeVector( a_vec )
{
    var normVec = $.extend( false, {}, a_vec );
    var len = Math.sqrt( normVec.m_x * normVec.m_x + normVec.m_y * normVec.m_y );

    if ( !( len < EPSILON ) )
    {
        normVec.m_x /= len;
        normVec.m_y /= len;
    }

    return normVec;
}

function GetDirection( a_p1, a_p2 )
{
    var dirVec = { m_x : a_p2.m_x - a_p1.m_x,
                   m_y : a_p2.m_y - a_p1.m_y };

    NormalizeVector( dirVec );

    return dirVec;
}

EPSILON = 0.000000001;