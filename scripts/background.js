function Background()
{
	var CELL_SIZE = 20;

	var Init = function()
	{
		width  = gl.viewportWidth;
		height = gl.viewportHeight;

		this.m_columnCnt = width / CELL_SIZE + 1;
		this.m_rowCnt 	 = height / CELL_SIZE + 1;

		this.m_verts = [];

		for ( var i = 0; i < this.m_columnCnt; ++i )
		{
			this.m_verts.push( i * CELL_SIZE, 0.0  );
			this.m_verts.push( i * CELL_SIZE, height );
		}

		for ( var i = 0; i < this.m_rowCnt; ++i )
		{
			this.m_verts.push( 0, 	   i * CELL_SIZE );
			this.m_verts.push( width, i * CELL_SIZE );
		}

        this.m_size 	= 2 * this.m_columnCnt + 2 * this.m_rowCnt;
        this.m_vertBuff = gl.createBuffer();
	}

	this.Draw = function ()
	{
		gl.lineWidth( 0.05 );
		gl.getParameter( gl.ALIASED_LINE_WIDTH_RANGE );
	 	gl.uniform4f( g_graphics.m_shaderProgram.m_colorUniform, 0.5, 0.5, 0.5, 1 );
        gl.bindBuffer( gl.ARRAY_BUFFER, this.m_vertBuff );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( this.m_verts ), gl.STATIC_DRAW );
        gl.enableVertexAttribArray( g_graphics.m_shaderProgram.m_positionAttribute );
        gl.vertexAttribPointer( g_graphics.m_shaderProgram.m_positionAttribute, 2, gl.FLOAT, false, 0, 0 );
        gl.drawArrays( gl.LINES, 0, this.m_size );
	}

	Init.apply( this );
}