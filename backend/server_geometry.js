var jQuery    = require( 'jquery' );
var Constants = require( '../shared/constants' ).Geometry;

Geometry =
{
    ScalarMul : function( a_vecA, a_vecB )
    {
        return a_vecA.m_x * a_vecB.m_x + a_vecA.m_y * a_vecB.m_y;
    },

    PointInRect : function( a_pos, a_rec )
    {
        var verts = a_rec.m_verts;
        var elCnt = verts.length;

        for ( var i = 0; i < elCnt; i += 2 )
        {
            var nextInd = ( i + 2 ) % elCnt;

            var currVec = { m_x : verts[ nextInd ]     - verts[ i ],
                            m_y : verts[ nextInd + 1 ] - verts[ i + 1 ] };

            var testVec = { m_x : a_pos.m_x - verts[ i ],
                            m_y : a_pos.m_y - verts[ i + 1 ] }

            if ( this.ScalarMul( currVec, testVec ) < Constants.EPSILON )
                return false;
        }

        return true;
    },

    PointInCircle : function( a_pos, m_center, a_rad )
    {
        var vec = { m_x : a_pos.m_x - m_center.m_x,
                    m_y : a_pos.m_y - m_center.m_y };

        return vec.m_x * vec.m_x + vec.m_y * vec.m_y + Constants.EPSILON <= a_rad;
    }

    Rectangle : function( a_pos, a_width, a_height )
    {
        this.GenerateRectanglePoints = function()
        {
            this.m_verts = [ a_pos.m_x - a_width / 2.0, a_pos.m_y + a_height / 2.0,
                             a_pos.m_x + a_width / 2.0, a_pos.m_y + a_height / 2.0,
                             a_pos.m_x + a_width / 2.0, a_pos.m_y - a_height / 2.0,
                             a_pos.m_x - a_width / 2.0, a_pos.m_y - a_height / 2.0 ];

            this.m_size = 4;
            this.m_pos  = jQuery.extend( false, {}, a_pos );
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

            this.m_pos = jQuery.extend( false, {}, a_pos );
        }

        this.GenerateRectanglePoints();
    }
}

module.exports = { Geometry : Geometry };