var jQuery  = require( 'jquery' );
var EPSILON = require( '../shared/constants' ).EPSILON;

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
        return Math.sqrt( this.DistSqr( a_vecA, a_vecB ) );
    },

    PseudoScalarMul : function ( a_vecA, a_vecB )
    {
        return a_vecA.m_x * a_vecB.m_y - a_vecA.m_y * a_vecB.m_x;
    },

    ScalarMul : function( a_vecA, a_vecB )
    {
        return a_vecA.m_x * a_vecB.m_x + a_vecA.m_y * a_vecB.m_y;
    },

    IsNullVec : function ( a_vec )
    {
        return Math.abs( this.ScalarMul( a_vec, a_vec ) ) < EPSILON;
    },

    NormalizeVector : function ( a_vec )
    {
        var normVec = jQuery.extend( false, {}, a_vec );
        var len = Math.sqrt( normVec.m_x * normVec.m_x + normVec.m_y * normVec.m_y );

        if ( !( len < Geometry.EPSILON ) )
        {
            normVec.m_x /= len;
            normVec.m_y /= len;
        }

        return normVec;
    },

    GetVec : function ( a_p1, a_p2 )
    {
        var dirVec = { m_x : a_p2.m_x - a_p1.m_x,
                       m_y : a_p2.m_y - a_p1.m_y };
        return dirVec;
    },

    GetDirection : function ( a_p1, a_p2 )
    {
        return this.NormalizeVector( this.GetVec( a_p1, a_p2 ) );
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

            if ( this.ScalarMul( currVec, testVec ) < EPSILON )
                return false;
        }

        return true;
    },

    PointInCircle : function( a_pos, m_center, a_rad )
    {
        var vec = { m_x : a_pos.m_x - m_center.m_x,
                    m_y : a_pos.m_y - m_center.m_y };

        return vec.m_x * vec.m_x + vec.m_y * vec.m_y + EPSILON <= a_rad * a_rad;
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
        return ( a_begin + EPSILON < a_target ) && ( a_target + EPSILON < a_end );
    },

    InSegment : function ( a_begin, a_end, a_target )
    {
        return ( Math.abs( a_target - a_begin ) < EPSILON ) || ( Math.abs( a_target - a_end ) < EPSILON ) || this.InInterval( a_begin, a_end, a_target );
    },

    SegAndSegIntersect : function ( a_aSegBegin, a_aSegVec, a_bSegBegin, a_bSegVec )
    {
        var segRayVec = { m_x : a_aSegBegin.m_x - a_bSegBegin.m_x,
                          m_y : a_aSegBegin.m_y - a_bSegBegin.m_y };

        mul1 = this.PseudoScalarMul( a_bSegVec, a_aSegVec );

        if ( Math.abs( mul1 ) < EPSILON )
            return { m_intersect : false };

        mul2 = this.PseudoScalarMul( segRayVec, a_aSegVec  );

        var betta = mul2 / mul1;
        var alpha = this.PseudoScalarMul( segRayVec, a_bSegVec ) / mul1;

        if ( this.InSegment( 0.0, 1.0, betta ) && this.InSegment( 0.0, 1.0, alpha ) )
            return { m_intersect : true, m_alpha : alpha, m_betta : betta };

        return { m_intersect : false };
    },

    //Возвращает наиболее близкую к началу отрезка точку
    SegRecIntersect : function ( a_segBegin, a_segVec, a_rec )
    {
        var intersected  = false;
        var closestAlpha = -1.0;
        var elCnt = 2 * a_rec.m_size;
        for ( var i = 0; i < elCnt; i += 2 )
        {
            var nextInd = ( i + 2 ) % elCnt;

            segBegin = { m_x : a_rec.m_verts[ i ],
                         m_y : a_rec.m_verts[ i + 1 ] };

            segVec   = { m_x : a_rec.m_verts[ nextInd ]     - a_rec.m_verts[ i ],
                         m_y : a_rec.m_verts[ nextInd + 1 ] - a_rec.m_verts[ i + 1 ] };

            res = this.SegAndSegIntersect( a_segBegin, a_segVec, segBegin, segVec );

            if ( res.m_intersect === true )
            {
                if ( !intersected )
                {
                    closestAlpha = res.m_alpha;
                    intersected = true;
                }
                else if ( res.m_alpha + EPSILON < closestAlpha )
                    closestAlpha = res.m_alpha;
            }
        }

        if ( !intersected )
            return { m_intersect : false };

        var point = { m_x : a_segBegin.m_x + closestAlpha * a_segVec.m_x,
                      m_y : a_segBegin.m_y + closestAlpha * a_segVec.m_y };

        return { m_intersect : true, m_point : point };
    },

    //Возвращает точки в порядке удаления от начала луча
    RayCircleIntersectInner : function ( a_rayBegin, a_rayDir, a_center, a_rad )
    {
        var circRayVec = { m_x : a_rayBegin.m_x - a_center.m_x,
                           m_y : a_rayBegin.m_y - a_center.m_y }
        var a = this.ScalarMul( a_rayDir, a_rayDir );
        var b = 2 * this.ScalarMul( circRayVec, a_rayDir );
        var f = this.ScalarMul( circRayVec, circRayVec );
        var c = f - a_rad * a_rad;

        var discr = b * b - 4 * a * c;

        if ( discr < -EPSILON )
            return [];

        discr = Math.sqrt( discr );

        var params = [ ( -b - discr ) / ( 2 * a ),
                       ( -b + discr ) / ( 2 * a ) ];

        if ( Math.abs( params[ 0 ] - params[ 1 ] ) < EPSILON )
            params = [ params[ 0 ] ];

        var ans = [];
        for ( var i = 0; i < params.length; ++i )
        {
            if ( ( Math.abs( params[ i ] ) < EPSILON ) || ( params[ i ] > EPSILON ) )
            {
                var pos = { m_x : a_rayBegin.m_x + params[ i ] * a_rayDir.m_x,
                            m_y : a_rayBegin.m_y + params[ i ] * a_rayDir.m_y }

                ans.push( { m_pos : pos, m_param : params[ i ] } )
            }
        }

        return ans;
    },

    //Возвращает точки в порядке удаления от начала отрезка
    SegCircleIntersect : function ( a_segBegin, a_segVec, a_center, a_rad )
    {
        var ans = [];
        var intersPoints = this.RayCircleIntersectInner( a_segBegin, a_segVec, a_center, a_rad );

        for ( var i = 0; i < intersPoints.length; ++i )
        {
            if ( this.InSegment( 0.0, 1.0, intersPoints[ i ].m_param ) )
                ans.push( intersPoints[ i ].m_pos );
        }

        return ans;
    },

    //Возвращает все точки пересечения
    CircleRecIntersect : function ( a_center, a_rad, a_rec )
    {
        var res = { m_intersect : false,
                    m_points    : [],
                    m_pointsCnt : 0 };
        var elCnt = 2 * a_rec.m_size;

        for ( var i = 0; i < elCnt; i += 2 )
        {
            var nextInd = ( i + 2 ) % elCnt;

            segBegin = { m_x : a_rec.m_verts[ i ],
                         m_y : a_rec.m_verts[ i + 1 ] };

            segDir   = { m_x : a_rec.m_verts[ nextInd ]     - a_rec.m_verts[ i ],
                         m_y : a_rec.m_verts[ nextInd + 1 ] - a_rec.m_verts[ i + 1 ] };

            var currRes = this.SegCircleIntersect( segBegin, segDir, a_center, a_rad );
            if ( res.length != 0 )
            {
                res.m_intersect  = true;
                res.m_points     = res.m_points.concat( currRes );
                res.m_pointsCnt += currRes.length;
            }
        }

        return res;
    },

    SegInterOrInRec : function ( a_segBegin, a_segVec, a_rec )
    {
        //1) Отрезок слишком мал, чтобы пересечься с прямоугольником. Берем любую точку, так как отрезок все равно лежит целиком внутри
        if ( this.PointInRect( a_segBegin, a_rec ) === true )
            return {  m_intersect : true, m_point : a_segBegin };

        //2) Пересекаем отрезок с прямоугольником
        return this.SegRecIntersect( a_segBegin, a_segVec, a_rec );
    },


    SegInterOrInCircle : function ( a_segBegin, a_segVec, a_center, a_rad )
    {
        //1) Отрезок слишком мал, чтобы пересечься с окружностью. Берем любую точку, так как отрезок все равно лежит целиком внутри
        if ( this.PointInCircle( a_segBegin, a_center, Player.RAD ) )
            return { m_intersect : true, m_point : a_segBegin };

        //2) Пересекаем отрезок с окружностью
        var res = this.SegCircleIntersect( a_segBegin, a_segVec, a_center, a_rad );

        if ( res.length > 0 )
            return { m_intersect : false, m_point : res[ 0 ] };

        return { m_intersect : false };
    }

}

module.exports = { Geometry : Geometry };