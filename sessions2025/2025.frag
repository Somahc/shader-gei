const float FAR = 1E2;

mat3 orthbas( vec3 z ) {
  z = normalize( z );
  float isveryy = step( 0.999, abs( z.y ) );
  vec3 up = vec3( 0.0, 1.0 - isveryy, isveryy );
  vec3 x = normalize( cross( up, z ) );
  return mat3( x, cross( z, x ), z );
}

vec4 isectBox( vec3 ro, vec3 rd, vec3 s ) {
  vec3 xo = -ro / rd;
  vec3 xs = abs( s / rd );

  vec3 dfv = xo - xs;
  vec3 dbv = xo + xs;

  float df = max( dfv.x, max( dfv.y, dfv.z ) );
  float db = min( dbv.x, min( dbv.y, dbv.z ) );
  if ( df < 0.0 ) { return vec4( FAR ); }
  if ( db < df ) { return vec4( FAR ); }

  vec3 n = -sign( rd ) * step( vec3( df ), dfv );
  return vec4( n, df );
}

struct QTR {
  vec3 cell;
  vec3 size;
  float len;
  bool hole;
};

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec2 p = uv * 2. - 1.;
  p.x *= iResolution.x / iResolution.y;

  vec3 ro = vec3(0., 2., 5.);
  vec3 ta = vec3(0., 0., 0.);
  vec3 rd = orthbas(ro - ta) * normalize(vec3(p, -2.));

  vec4 isect = isectBox(ro, rd, vec3(1.5, 1., 0.5));

  vec4 color;

  if (isect.w < FAR) {
    color = vec4(0.5 + 0.5 * isect.xyz, 1.);
  } else {
    color = vec4(0.);
  }

  fragColor = color;

}