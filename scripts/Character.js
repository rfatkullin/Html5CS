function Character( a_pos, a_vel )
{
    const RADIUS   = 10.0;
    const VELOCITY = 5.0;

    this.m_pos    = new Vector( a_pos.m_x, a_pos.m_y );
    this.m_vel    = new Vector( a_vel.m_x, a_vel.m_y );
    //this.m_figure = new Circle( a_pos, RADIUS );
    this.m_figure = new Rectangle( a_pos, 100.0, 100.0 );

    this.SetPos = function( a_pos )
    {
        this.m_pos = new Vector( a_pos.m_x, a_pos.m_y );
        this.m_figure.SetPos( a_pos );
    }

    this.GetPos = function()
    {
        return this.m_pos;
    }

    this.Draw = function()
    {
        this.m_figure.Draw();
    }

    this.ShiftOn = function( a_pos )
    {
        this.m_figure.ShiftOn( { m_x : VELOCITY * a_pos.m_x, m_y : VELOCITY * a_pos.m_y } );
    }
}

//function DebugMode()
//{
//    var character = new Character( { m_x : 100.0, m_y : 100.0 }, { m_x : 0.0, m_y : 0.0 } );
//    alert( "Character position: (" + character.GetPos().m_x + ", " + character.GetPos().m_y  + ")" );
//
//    character.SetPos( { m_x : 200.0, m_y : 200.0 } );
//    alert( "Character position: (" + character.GetPos().m_x + ", " + character.GetPos().m_y  + ")" );
//
//
//    var pos = character.GetPos();
//    pos.m_x =  2;
//    pos.m_y = -2;
//
//    alert( "Character position: (" + character.GetPos().m_x + ", " + character.GetPos().m_y  + ")" );
//
//}