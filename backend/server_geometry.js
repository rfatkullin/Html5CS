var jQuery    = require( 'jquery' );
var Constants = require( '../shared/constants' ).Geometry;
var Collide   = require( '../shared/constants' ).Collide;

Geometry =
{
    Length : function( a_vec )
    {
        return Math.sqrt( this.ScalarMul( a_vec, a_vec ) );
    },

    DistSqr : function ( a_vecA, a_vecB )
    {
        return ( a_vecA.m_x - a_vecB.m_x ) * ( a_vecA.m_x - a_vecB.m_x ) + ( a_vecA.m_y - a_vecB.m_y ) * ( a_vecA.m_y - a_vecB.m_y );
    },

    Dist : function ( a_vecA, a_vecB )
    {
        return Math.sqrt( DistSqr( a_vecA, a_vecB ) );
    },

    PseudoScalarMul : function ( a_vecA, a_vecB )
    {
        return a_vecA.m_x * a_vecB.m_y - a_vecA.m_y * a_vecB.m_x;
    },

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
    },

    InInterval : function ( a_begin, a_end, a_target )
    {
        return ( a_begin + Constants.EPSILON < a_target ) && ( a_target + Constants.EPSILON < a_end );
    },

    InSegment : function ( a_begin, a_end, a_target )
    {
        return ( Math.abs( a_target - a_begin ) < Constants.EPSILON ) || ( Math.abs( a_target - a_end ) < Constants.EPSILON ) || this.InInterval( a_begin, a_end, a_target );
    },

    RaySegIntersect : function ( a_rayBegin, a_rayDir, a_segStart, a_segVec )
    {
        var segRayVec = { m_x : a_rayBegin.m_x - a_segStart.m_x,
                          m_y : a_rayBegin.m_y - a_segStart.m_y };

        mul1 = this.PseudoScalarMul( a_segVec, a_rayDir );

        if ( Math.abs( mul1 ) < Constants.EPSILON )
            return { m_alpha : -1.0, m_betta : -1.0 };

        mul2 = this.PseudoScalarMul( segRayVec, a_rayDir  );

        var betta = mul2 / mul1;
        var alpha = this.PseudoScalarMul( segRayVec, a_segVec ) / mul1;

        if ( this.InSegment( 0.0, 1.0, betta  ) && ( ( Math.abs( alpha ) < Constants.EPSILON ) || ( alpha > Constants.EPSILON ) ) )
            return { m_alpha : alpha, m_betta : betta };

        return { m_alpha : -1.0, m_betta : -1.0 };
    },

    RayRecIntersect : function ( a_rayBegin, a_rayDir, a_rec )
    {
        var intersected  = false;
        var closestAlpha = -1.0;
        var elCnt = 2 * a_rec.m_size;
        for ( var i = 0; i < elCnt; i += 2 )
        {
            var nextInd = ( i + 2 ) % elCnt;

            segBegin = { m_x : a_rec.m_verts[ i ],
                         m_y : a_rec.m_verts[ i + 1 ] };

            segDir   = { m_x : a_rec.m_verts[ nextInd ]     - a_rec.m_verts[ i ],
                         m_y : a_rec.m_verts[ nextInd + 1 ] - a_rec.m_verts[ i + 1 ] };

            res = this.RaySegIntersect( a_rayBegin, a_rayDir, segBegin, segDir );

            if ( this.InSegment( 0.0, 1.0, res.m_betta ) && ( ( Math.abs( res.m_alpha ) < Constants.EPSILON ) || ( res.m_alpha > Constants.EPSILON ) ) )
            {
                if ( !intersected )
                {
                    closestAlpha = res.m_alpha;
                    intersected = true;
                }
                else if ( res.m_alpha + Constants.EPSILON < closestAlpha )
                    closestAlpha = res.m_alpha;
            }
        }

        if ( !intersected )
            return { m_intersect : false };

        var point = { m_x : a_rayBegin.m_x + closestAlpha * a_rayDir.m_x,
                      m_y : a_rayBegin.m_y + closestAlpha * a_rayDir.m_y };

        return { m_intersect : true, m_point : point };
    },

    RayCircleIntersectInner : function ( a_rayBegin, a_rayDir, a_center, a_rad )
    {
        var circRayVec = { m_x : a_rayBegin.m_x - a_center.m_x,
                           m_y : a_rayBegin.m_y - a_center.m_y }
        var a = this.ScalarMul( a_rayDir, a_rayDir );
        var b = 2 * this.ScalarMul( circRayVec, a_rayDir );
        var f = this.ScalarMul( circRayVec, circRayVec );
        var c = f - a_rad * a_rad;

        var discr = b * b - 4 * a * c;

        if ( discr < Constants.EPSILON )
            return false;

        discr = Math.sqrt( discr );

        var params = [ ( -b - discr ) / ( 2 * a ),
                       ( -b + discr ) / ( 2 * a ) ];

        var ans = [];
        for ( var i = 0; i < params.length; ++i )
        {
            if ( ( Math.abs( params[ i ] ) < Constants.EPSILON ) || ( params[ i ] > Constants.EPSILON ) )
            {
                var pos = { m_x : a_rayBegin.m_x + params[ i ] * a_rayDir.m_x,
                            m_y : a_rayBegin.m_y + params[ i ] * a_rayDir.m_y }

                ans.push( { m_pos : pos, m_param : params[ i ] } )
            }
        }

        return ans;
    },

    RayCircleIntersect : function ( a_rayBegin, a_rayDir, a_center, a_rad )
    {
        var res = this.RayCircleIntersectInner( a_rayBegin, a_rayDir, a_center, a_rad );

        if ( res.length === 0 )
            return { m_intersect : false };

        return { m_intersect : true, m_point : res[ 0 ].m_pos };
    },

    SegCircleIntersect : function ( a_segBegin, a_segVec, a_center, a_rad )
    {
        var ans = [];
        var intersPoints = this.RayCircleIntersectInner( a_segBegin, a_segVec, a_center, a_rad );

        for ( var i = 0; i < intersPoints.length; ++i )
        {
            if ( this.InSegment( 0.0, 1.0, intersPoints[ i ].m_param ) )
                ans.push( intersPoints[ i ] );
        }

        return ans;
    },

    CircleRecIntersect : function ( a_center, a_rad, a_rec )
    {
        var elCnt = 2 * a_rec.m_size;

        for ( var i = 0; i < elCnt; i += 2 )
        {
            var nextInd = ( i + 2 ) % elCnt;

            segBegin = { m_x : a_rec.m_verts[ i ],
                         m_y : a_rec.m_verts[ i + 1 ] };

            segDir   = { m_x : a_rec.m_verts[ nextInd ]     - a_rec.m_verts[ i ],
                         m_y : a_rec.m_verts[ nextInd + 1 ] - a_rec.m_verts[ i + 1 ] };

            var res = this.SegCircleIntersect( segBegin, segDir, a_center, a_rad );
            if ( res.length != 0 )
            {
                return { m_intersect : true, m_point : res[ 0 ], m_pointsCnt : res.length };
            }
        }

        return { m_intersect : false };
    }
}

module.exports = { Geometry : Geometry };