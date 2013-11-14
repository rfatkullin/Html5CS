function Character( a_pos )
{
    const RADIUS        = 20.0;
    const VELOCITY      = 5.0;
    const BARREL_LENGTH = 30.0;

    var Init = function ()
    {
        this.m_pos    = $.extend( false, {}, a_pos );
        this.m_figure = new Circle( a_pos, RADIUS );
        this.m_barrel = new Barrel( a_pos, BARREL_LENGTH );
        this.m_figColor  = [ 0.0, 1.0, 0.0, 0.3 ];
        this.m_barrColor = [ 0.0, 0.0, 0.0, 1.0 ];

    }

    this.SetPos = function( a_pos )
    {
        this.m_pos = $.extend( false, {}, a_pos );
        this.m_figure.SetPos( a_pos );
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

    this.ChangeBarrelDirTo = function ( a_point )
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

    Init.apply( this );
}

function Barrel( a_pos, a_length  )
{
    var Init = function ()
    {
        this.m_line = new Line( { m_x : a_pos.m_x,              m_y : a_pos.m_y },
                                { m_x : a_pos.m_x + a_length,   m_y : a_pos.m_y },
                                a_length );
    }

    this.ChangeDir = function ( a_dir )
    {
        this.m_line.ChangeDir( a_dir );
    }

    this.Draw = function ( a_color )
    {
        this.m_line.Draw( a_color );
    }

    this.ShiftOn = function ( a_shiftVec )
    {
        this.m_line.ShiftOn( a_shiftVec );
    }

    Init.apply( this );
}

