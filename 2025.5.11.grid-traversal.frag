precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;

const float EPS = 0.0001;
const float pi = acos(-1.0);
const float pi2 = pi * 2.0;
const float angle = 60.0;
const float fov = angle * 0.5 * pi / 180.0;
const float sphereSize = 1.0;
vec3 lightDir = vec3(-0.577, 0.577, 0.577);

#define C_HASH 2309480282U

float hash12( vec2 p )
{
    uvec2 x = floatBitsToUint(p);
    x = C_HASH * ((x>>8U)^x.yx);
    x = C_HASH * ((x>>8U)^x.yx);
    x = C_HASH * ((x>>8U)^x.yx);
    
    return float(x.x)*(1.0/float(0xffffffffU));
}

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

vec2 gridCenter;
float gridTraversal(vec2 ro, vec2 rd) {
    gridCenter = floor((ro + rd * 1E-3)) + .5;

    vec2 src = -(ro - gridCenter) / rd;
    vec2 dst = abs(.5/rd);
    vec2 bv = src + dst;

    return min(bv.x, bv.y);
}

float distFunc(vec3 p){
    p.xz -= gridCenter;
    
    float offset = hash12(gridCenter);

    float d = sdBox( p + vec3(0., offset, 0.), vec3(0.5, 2., .5));
    return d;
}


vec3 getNormal( vec3 p) {
  vec2 d = vec2( 0, 1E-4 );
  return normalize(vec3(
    distFunc( p + d.yxx) - distFunc( p - d.yxx),
    distFunc( p + d.xyx) - distFunc( p - d.xyx),
    distFunc( p + d.xxy) - distFunc( p - d.xxy)
  ));
}


void main(void){
    vec2 p = (gl_FragCoord.xy * 2. - resolution) / min(resolution.x, resolution.y);
    
    vec3 ro = vec3(0., 3., -3. + time); // ray origin
    vec3 ta = vec3(0., 0., 0.); // target
    vec3 fwd = normalize(ta - ro); // forward direction
    vec3 up = vec3(0., 1., 0.); // up direction
    vec3 side = normalize(cross(fwd, up)); // side direction
    up = normalize(cross(side, fwd)); // recalculate up direction
    float fov = 1.0;
    vec3 rd = normalize(p.x * side + p.y * up + fwd * fov); // ray direction

    float dist = 0.;
    float rLen = 0.;
    vec3 rPos = ro;
    int step = 0;

    float mainEmissive = 0.0;

    vec3 color;
    for(int i = 0; i < 100; i++) {
        step++;
        float limitD = gridTraversal(rPos.xz, rd.xz);
        dist = distFunc(rPos);

        if (abs(dist) < EPS) {
            break;
        }
        dist = min(dist, limitD);
        rLen += dist;
        rPos += rd * dist;

    }

    color = vec3(exp(-.1 * rLen));
    gl_FragColor = vec4(color, 1.0);

}