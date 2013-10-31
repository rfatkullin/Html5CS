function Cursor ( a_pos )
{
    var LENGTH = 10;
    var OFFSET = 3;

    var Init = function ()
    {   
        var leftLine    = { m_start : new Vector( 0.0, 0.0 ), m_end : new Vector( 0.0, 0.0 ) };
        var rightLine   = { m_start : new Vector( 0.0, 0.0 ), m_end : new Vector( 0.0, 0.0 ) };
        var topLine     = { m_start : new Vector( 0.0, 0.0 ), m_end : new Vector( 0.0, 0.0 ) };
        var bottomLine  = { m_start : new Vector( 0.0, 0.0 ), m_end : new Vector( 0.0, 0.0 ) };

        leftLine.m_start.m_x    = a_pos.m_x - OFFSET; 
        leftLine.m_start.m_y    = a_pos.m_y;
        leftLine.m_end.m_x      = a_pos.m_x - OFFSET - LENGTH; 
        leftLine.m_end.m_y      = a_pos.m_y;

        rightLine.m_start.m_x   = a_pos.m_x + OFFSET; 
        rightLine.m_start.m_y   = a_pos.m_y;
        rightLine.m_end.m_x     = a_pos.m_x + OFFSET + LENGTH; 
        rightLine.m_end.m_y     = a_pos.m_y;

        topLine.m_start.m_x     = a_pos.m_x  
        topLine.m_start.m_y     = a_pos.m_y + OFFSET;
        topLine.m_end.m_x       = a_pos.m_x;
        topLine.m_end.m_y       = a_pos.m_y + OFFSET + LENGTH;


        bottomLine.m_start.m_x  = a_pos.m_x  
        bottomLine.m_start.m_y  = a_pos.m_y - OFFSET;
        bottomLine.m_end.m_x    = a_pos.m_x;
        bottomLine.m_end.m_y    = a_pos.m_y - OFFSET - LENGTH;


        this.m_lines = [ new Line( leftLine.m_start,    leftLine.m_end,   LENGTH  ),
                         new Line( rightLine.m_start,   rightLine.m_end,  LENGTH  ),
                         new Line( topLine.m_start,     topLine.m_end,    LENGTH  ),
                         new Line( bottomLine.m_start,  bottomLine.m_end, LENGTH  ) ];

        this.m_color = [ 0.0, 0.0, 0.0, 1.0 ];

        this.m_size = 4;
    }

    this.SetPos = function ( a_pos )
    {
        this.m_lines[ 0 ].SetPos( { m_x : a_pos.m_x - OFFSET, m_y : a_pos.m_y } );
        this.m_lines[ 1 ].SetPos( { m_x : a_pos.m_x + OFFSET, m_y : a_pos.m_y } );
        this.m_lines[ 2 ].SetPos( { m_x : a_pos.m_x,          m_y : a_pos.m_y + OFFSET } );
        this.m_lines[ 3 ].SetPos( { m_x : a_pos.m_x,          m_y : a_pos.m_y - OFFSET } );

        document.getElementById( "line1" ).innerHTML = "Line1: (" + this.m_lines[ 0 ].m_verts[ 0 ] + ", " +  this.m_lines[ 0 ].m_verts[ 1 ] + ")-" +
                                                              "(" + this.m_lines[ 0 ].m_verts[ 2 ] + ", " +  this.m_lines[ 0 ].m_verts[ 3 ] + ")";

        document.getElementById( "line2" ).innerHTML = "Line2: (" + this.m_lines[ 1 ].m_verts[ 0 ] + ", " +  this.m_lines[ 1 ].m_verts[ 1 ] + ")-" +
                                                              "(" + this.m_lines[ 1 ].m_verts[ 2 ] + ", " +  this.m_lines[ 1 ].m_verts[ 3 ] + ")";

        document.getElementById( "line3" ).innerHTML = "Line3: (" + this.m_lines[ 2 ].m_verts[ 0 ] + ", " +  this.m_lines[ 2 ].m_verts[ 1 ] + ")-" +
                                                              "(" + this.m_lines[ 2 ].m_verts[ 2 ] + ", " +  this.m_lines[ 2 ].m_verts[ 3 ] + ")";
        
        document.getElementById( "line4" ).innerHTML = "Line4: (" + this.m_lines[ 3 ].m_verts[ 0 ] + ", " +  this.m_lines[ 3 ].m_verts[ 1 ] + ")-" +
                                                              "(" + this.m_lines[ 3 ].m_verts[ 2 ] + ", " +  this.m_lines[ 3 ].m_verts[ 3 ] + ")";
    }

    this.Draw = function ()
    {
        for ( var i = 0; i < this.m_size; ++i )
            this.m_lines[ i ].Draw( this.m_color );
    }

    Init.apply( this );    
}