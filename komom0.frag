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

mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
}

float distSphere(vec3 p, float r){
    return length(p) - r;
}

float sdTorus( vec3 p, vec2 t )
{
    vec2 q = vec2(length(p.xy)-t.x,p.z);
    return length(q)-t.y;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdLink( vec3 p, float le, float r1, float r2 )
{
    vec3 p2 = p;
    vec3 p3 = p;
    p.x += 0.1;
    p.y -= 0.1;
    vec3 q = vec3( p.x, max(abs(p.y)-le,0.0), p.z );
    p2.y -= 0.6;
    p3.x += 0.3;
    p3.y -= 0.3;

    // return min(min(length(vec2(length(q.xy)-r1,q.z)) - r2, sdBox(p2, vec3(1.5, .06, .5))), sdBox(p3, vec3(.1, .5, .5)));

    float masks = min(sdBox(p2, vec3(1.5, .06, .5)), sdBox(p3, vec3(.12, .5, .5)));

    return max(length(vec2(length(q.xy)-r1,q.z)) - r2, -masks);
    // return length(vec2(length(q.xy)-r1,q.z)) - r2;



    // return sdBox(p2, vec3(1.5, .04, .5));
}

float ko(vec3 p) {
    float torus = sdTorus(p, vec2(.15, .01));
    float box = sdBox(p, vec3(1.5, .04, .5));
    return max(torus, -box);
}

float doubleKo(vec3 p) {
    vec3 q = p;
    q.y += -.3;
    // return ko(q);
    return min(ko(q), ko(p));
}

float distFunc(vec3 p){
    // return doubleKo(p);
    float a = 1.5;
    p = mod(p, a) - a / 2.;
    return min(doubleKo(p), sdLink(p, .4, .1, .01));
}

vec3 normal(vec3 p){
    float d = 0.0001;
    return normalize(vec3(
        distFunc(p + vec3(  d, 0.0, 0.0)) - distFunc(p + vec3( -d, 0.0, 0.0)),
        distFunc(p + vec3(0.0,   d, 0.0)) - distFunc(p + vec3(0.0,  -d, 0.0)),
        distFunc(p + vec3(0.0, 0.0,   d)) - distFunc(p + vec3(0.0, 0.0,  -d))
    ));
}

void main(void){
    vec2 p = (gl_FragCoord.xy * 2. - resolution) / min(resolution.x, resolution.y);
    
    vec3 ro = vec3(0., 0., -3.); // ray origin
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

    for(int i = 0; i < 100; i++) {
        step++;
        dist = distFunc(rPos);
        rLen += dist;
        rPos = ro + rd * rLen;

        if (abs(dist) < EPS) {
            break;
        }
    }

    vec3 color;
    color = vec3(exp(-.4 * rLen));
    
    gl_FragColor = vec4(color, 1.0);

}