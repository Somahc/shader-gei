#define lofi(i,j) (floor((i)/(j))*(j))
#define fs(i) (fract(sin((i)*114.514)*1919.810))

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

QTR qt(vec3 ro, vec3 rd) {
  QTR r;
  r.hole = false;
  r.size = vec3(1, 1E3, 1);
  for(int i=0; i<4; i++) {
    r.size /= 2.;
    r.cell = lofi(ro + rd*1E-2*r.size.x, r.size) + r.size/2.;
    r.hole = r.cell.y > 0.;
    // r.hole = abs(r.cell.y) < 100.;
    // r.hole = abs(r.cell.x) < 100.;
    // r.hole = abs(r.cell.z) < 100.;

    // r.hole = abs(r.cell.y) < 100. && abs(r.cell.x) < 100. && abs(r.cell.z) < 100.;

    if(r.hole) break;
    float di = fs(dot(r.cell, vec3(3,4,5)));
    if(di>.5) break;
  }

  vec3 src = (ro-r.cell)/rd;
  vec3 dst = abs(r.size/2./rd);
  vec3 bv = -src + dst;
  r.len = min(min(bv.x, bv.y), bv.z);

  return r;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec2 p = uv * 2. - 1.;
  p.x *= iResolution.x / iResolution.y;

  vec3 ro = vec3(0, 3., 5.);
  vec3 ta = vec3(0., -1., -1.);
  vec3 rd = orthbas(ro - ta) * normalize(vec3(p, -2.));

  vec4 isect = isectBox(ro, rd, vec3(1.5, 1., 0.5));

  vec4 color;

  for(int i=0; i<100; i++) {
    QTR qtr = qt(ro, rd);

    vec4 isect = vec4(1E2);
    vec3 off = vec3(0);
    if(!qtr.hole) {
      vec3 size = qtr.size / 2. - 0.01;

      // 各セルをランダムに動かすところ(0b5vr san)
      // float di = fs(dot(qtr.cell, vec3(2,6,6)));
      // float ph = iTime + dot(qtr.cell, vec3(1)) + 3. * di;
      // off.y -= 0.5 + 0.5 * sin(ph);

      isect = isectBox(ro-qtr.cell-off, rd, size);
    }

    if(isect.w<1E2) {
      vec3 n = isect.xyz;
      ro += rd*isect.w;

      color = vec4(n, 1.);
      break;
      // rd = reflect(rd, n);
    } else {
      ro += rd * qtr.len;
    }
  }

  fragColor = color;

}