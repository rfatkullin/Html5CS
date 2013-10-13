function Vector( a_posX, a_posY )
{
    this.m_x = a_posX;
    this.m_y = a_posY;
}

function Circle( a_pos, a_radius )
{
    function GenerateCirclePoints()
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

    this.ShiftOn = function ( a_pos )
    {
        for ( i = 0; i < this.m_size; i += 2 )
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

    this.Draw = function()
    {
        gl.bindBuffer( gl.ARRAY_BUFFER, this.m_vertBuff );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( this.m_verts ), gl.STATIC_DRAW );
        gl.enableVertexAttribArray( g_graphics.m_shaderProgram.m_positionAttribute );
        gl.vertexAttribPointer( g_graphics.m_shaderProgram.m_positionAttribute, 2, gl.FLOAT, false, 0, 0 );
        gl.drawArrays( gl.TRIANGLE_FAN, 0, this.m_size );
    }

    //Initialize
    GenerateCirclePoints.apply( this );
    this.m_vertBuff = gl.createBuffer();
}

function Rectangle( a_pos, a_width, a_height )
{
    function GenerateRectanglePoints()
    {
        this.m_verts = [ a_pos.m_x - a_width / 2.0, a_pos.m_y + a_height / 2.0,
                         a_pos.m_x + a_width / 2.0, a_pos.m_y + a_height / 2.0,
                         a_pos.m_x + a_width / 2.0, a_pos.m_y - a_height / 2.0,
                         a_pos.m_x - a_width / 2.0, a_pos.m_y - a_height / 2.0 ];

        this.m_size = 4;
        this.m_pos  = new Vector( a_pos.m_x, a_pos.m_y );
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
        for ( var i = 0; i < 2 * this.m_size; i += 2 )
        {
            this.m_verts[ i ]     += a_pos.m_x - this.m_pos;
            this.m_verts[ i + 1 ] += a_pos.m_y - this.m_pos;
        }

        this.m_pos = new Vector( a_pos.m_x, a_pos.m_y );
    }

    this.Draw = function()
    {
        gl.bindBuffer( gl.ARRAY_BUFFER, this.m_vertBuff );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( this.m_verts ), gl.STATIC_DRAW );
        gl.enableVertexAttribArray( g_graphics.m_shaderProgram.m_positionAttribute );
        gl.vertexAttribPointer( g_graphics.m_shaderProgram.m_positionAttribute, 2, gl.FLOAT, false, 0, 0 );
        gl.drawArrays( gl.TRIANGLE_FAN, 0, this.m_size );
    }

    //Initialize
    GenerateRectanglePoints.apply( this );
    this.m_vertBuff = gl.createBuffer();
}

function Triangle( a_pos )
{
    this.m_verts = [ 100.0, 100.0, 200.0, 100.0, 150.0, 150.0  ];
    this.m_size  = 3;
}
