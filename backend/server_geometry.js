var jQuery    = require( 'jquery' );
var Constants = require( '../shared/constants' ).Geometry;

Geometry =
{
    Geometry :: DistSqr( a_vecA, a_vecB )
    {
        return ( a_vecA.m_x - a_vecB.m_x ) * ( a_vecA.m_x - a_vecB.m_x ) + ( a_vecA.m_y - a_vecB.m_y ) * ( a_vecA.m_y - a_vecB.m_y );
    }

    Geometry :: Dist( a_vecA, a_vecB )
    {
        return Math.sqrt( DistSqr( a_vecA, a_vecB ) );
    }

    PseudoScalarMul : function ( a_vecA, a_vecB )
    {
        return a_vecA.m_x * a_vecB.m_y - a_vecA.m_y * a_vecB.m_x;
    }

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
    },

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

    InInterval : function ( a_begin, a_end, a_target )
    {
        return ( a_begin + Geometry.EPS < a_target ) && ( a_target + Geometry.EPS < a_end );
    }

    InSegment : function ( a_begin, a_end, a_target )
    {
        return ( Math.abs( a_target - a_begin ) < Geometry.EPS ) || ( Math.abs( a_target - a_end ) < Geometry.EPS ) || InInterval( a_begin, a_end, a_target );
    }

    RaySegIntersect : function ( a_rayBegin, a_rayDir, a_segStart, a_segVec )
    {
        var segRayVec = { m_x : a_rayBegin.m_x - a_segStart.m_x,
                          m_y : a_rayBegin.m_y - a_segStart.m_y };

        mul1 = PseudoScalarMul( a_segVec, a_rayDir );

        if ( Math.abs( mul1 ) < Geometry.EPS )
            return { m_alpha : -1.0, m_betta : -1.0 };

        mul2 = PseudoScalarMul( segRayVec, a_rayDir  );

        var betta = mul2 / mul1;
        var alpha = PseudoScalarMul( segRayVec, a_segVec ) / mul1;

        if ( InSegment( 0.0, 1.0, betta  ) && ( ( Math.abs( alpha ) < Geometry.EPS ) || ( alpha > Geometry.EPS ) ) )
            return { m_alpha : alpha, m_betta : betta };

        return { m_alpha : -1.0, m_betta : -1.0 };
    }

    RayRecIntersect : function ( a_rayBegin, a_rayDir, a_rec )
    {
        var intersected  = false;
        var closestAlpha = -1.0;
        var elCnt = 2 * a_rec.m_size;
        for ( int i = 0; i < elCnt; i += 2 )
        {
            int nextInd = ( i + 2 ) % elCnt;

            segBegin = { m_x : a_rec.m_verts[ i ],
                         m_y : a_rec.m_verts[ i + 1 ] };

            segDir   = { m_x : a_rec.m_verts[ aNextInd ]     - a_rec.m_verts[ i ],
                         m_y : a_rec.m_verts[ aNextInd + 1 ] - a_rec.m_verts[ i + 1 ] };

            res = RaySegIntersect( a_rayBegin, a_rayDir, segBegin, segDir );

            if ( InSegment( 0.0, 1.0, res.m_betta ) && ( ( Math.abs( res.m_alpha ) < Geometry.EPS ) || ( res.m_alpha > Geometry.EPS ) ) )
            {
                if ( !intersected )
                {
                    closestAlpha = res.m_alpha;
                    intersected = true;
                }
                else if ( res.m_alpha + Geometry.EPS < closestAlpha )
                    closestAlpha = res.m_alpha;
            }
        }

        if ( !intersected )
            return { m_intersect : false };

        var point = { m_x : a_rayBegin.m_x + closestAlpha * a_rayDir.m_x,
                      m_y : a_rayBegin.m_y + closestAlpha * a_rayDir.m_y };

        return { m_intersect : true, m_point : point };
    }

    RayCircleIntersect : function ( a_rayBegin, a_rayDir, a_center, a_rad )
    {
        var circRayVec = { m_x : a_rayBegin.m_x - a_center.m_x,
                           m_y : a_rayBegin.m_y - a_center.m_y }
        var a = this.DistSqr( a_rayDir );
        var b = 2 * this.ScalarMul( circRayVec, a_rayDir );
        var f = this.ScalarMul( circRayVec, circRayVec );
        var c = f - a_rad * a_rad;

        if ( Math.abs( a ) < Geometry.EPS )
        {
            if ( ( f - Geometry.EPS ) > a_rad * a_rad )
                return false;
            else
                return true;
        }

        var discr = b * b - 4 * a * c;

        if ( discr < Geometry.EPS )
            return false;

        discr = sqrt( discr );

        var params = [ ( -b - discr ) / ( 2 * a ),
                       ( -b + discr ) / ( 2 * a ) ];

        var ans = [];
        for ( var i = 0; i < params.length; ++i )
        {
            if ( ( Math.abs( params[ i ] ) < Geometry.EPS ) || ( params[ i ] > Geometry.EPS ) )
            {
                var pos = { m_x : a_rayBegin.m_x + params[ i ] * a_rayDir.m_x,
                            m_y : a_rayBegin.m_y + params[ i ] * a_rayDir.m_y }

                ans.push( { m_pos : pos, m_param : params[ i ] } )
            }
        }

        return ans;
    }

    SegCircleIntersect : function ( a_segBegin, a_segVec, a_center, a_rad )
    {
        var ans = [];
        var intersPoints = RayCircleIntersect( a_segBegin, a_segVec, a_center, a_rad );

        for ( var i = 0; i < intersPoints.length; ++i )
        {
            if ( this.InSegment( 0.0, 1.0, intersPoints[ i ].m_param ) )
                ans.push( intersPoints[ i ] );
        }

        return ans;
    }


    CircleRecIntersect : function ( a_center, a_rad, a_rec )
    {
        var elCnt = 2 * a_rec.m_size;

        for ( int i = 0; i < elCnt; i += 2 )
        {
            int nextInd = ( i + 2 ) % elCnt;

            segBegin = { m_x : a_rec.m_verts[ i ],
                         m_y : a_rec.m_verts[ i + 1 ] };

            segDir   = { m_x : a_rec.m_verts[ aNextInd ]     - a_rec.m_verts[ i ],
                         m_y : a_rec.m_verts[ aNextInd + 1 ] - a_rec.m_verts[ i + 1 ] };

            if ( SegCircleIntersect( segBegin, segDir, a_center, a_rad ).length != 0 )
                return true;
        }

        return false;
    }
}

module.exports = { Geometry : Geometry };