function Character( a_pos )
{
    this.m_pos    = $.extend( false, {}, a_pos );
    this.m_figure = new Circle( a_pos, Player.RAD );
    this.m_figColor  = [ 0.0, 1.0, 0.0, 0.3 ];
    this.m_barrColor = [ 0.0, 0.0, 0.0, 1.0 ];

    this.m_barrel = new Line( { m_x : a_pos.m_x,                 m_y : a_pos.m_y },
                              { m_x : a_pos.m_x + Player.BARREL_LENGTH, m_y : a_pos.m_y },
                              Player.BARREL_LENGTH );

    this.SetPos = function( a_pos )
    {
        this.m_pos = $.extend( false, {}, a_pos );
        this.m_figure.SetPos( a_pos );
        this.m_barrel.SetPos( a_pos );
    }

    this.GetPos = function()
    {
        return this.m_pos;
    }

    this.Draw = function( a_color )
    {
        this.m_figure.Draw( a_color );
        this.m_barrel.Draw( this.m_barrColor );
    }

    this.ShiftOn = function( a_pos )
    {
        var shiftVec = { m_x : Player.VEL * a_pos.m_x,
                         m_y : Player.VEL * a_pos.m_y };

        this.m_pos.m_x += shiftVec.m_x;
        this.m_pos.m_y += shiftVec.m_y;

        this.m_figure.ShiftOn( shiftVec );
        this.m_barrel.ShiftOn( shiftVec );

        var posDomElement = document.getElementById( "player_pos" ).innerHTML = "Player pos: (" + this.m_pos.m_x + ", " + this.m_pos.m_y + ")";
    }

    this.ChangeDirToPoint = function ( a_point )
    {
        var dir = { m_x : a_point.m_x - this.m_pos.m_x,
                    m_y : a_point.m_y - this.m_pos.m_y };

        var length = Math.sqrt( dir.m_x * dir.m_x + dir.m_y * dir.m_y );

        if ( length < RADIUS )
            return;

        dir.m_x /= length;
        dir.m_y /= length;

        this.m_barrel.ChangeDir( dir );
    }

    this.ChangeDir = function ( a_dir )
    {
        this.m_barrel.ChangeDir( a_dir );
    }
}
