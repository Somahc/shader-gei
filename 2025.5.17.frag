// Based on https://docs.google.com/presentation/d/1NGzXCUwpkruvGdBHWNnmT-mgAfT_71uoCnmMRXrZDKk/edit?slide=id.gadb502552c_1_409#slide=id.gadb502552c_1_409

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

mat2 rot (float r) {
    return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec2 pmod(vec2 p, float n) {
    float np = pi2 / n;
    float r = atan(p.x, p.y) - .5*np;
    r = mod(r, np) - .5*np;
    return length(p) * vec2(cos(r), sin(r));
}


float distSphere(vec3 p, float r){
    return length(p) - r;
}
float distCylinder(vec3 p, float h, float r) {
    vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(h,r);
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}
float distBox(vec3 p, vec3 s) {
    vec3 q = abs(p);
    vec3 m = max(s - q, 0.);
    return length(max(q - s, 0.)) - min(min(m.x, m.y), m.z);
}

float particle(vec3 p) {
    p.y += .1*sin(p.z*5.+time);
    p.xy *= rot(p.z * .3);
    p.z += -time;
    p = mod(p, .5) - .25;
    float cylinder = distCylinder(p, .0, 0.04);
    return cylinder;
    
}

float distFunc(vec3 p){
    p.z += 2.*time;
    p.xy = pmod(p.xy, 6.0);
    p = mod(p, .8) - .4;
    float d1 = distBox(p, vec3(10., .05, .05));
    float d2 = distBox(p, vec3(.05, .05, 10.));
    float d3 = distBox(p, vec3(.05, 10., .05));
    float d4 = distBox(p, vec3(.2, .2, .2));
    return min(min(d1, d2), min(d3, d4));
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

    p *= rot(time);
    
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
    float mainEmissive = 0.;
    float particleEmissive = 0.;

    for(int i = 0; i < 76; i++) {
        step++;
        rPos = ro + rd * rLen;
        dist = distFunc(rPos);
        float dist2 = particle(rPos);
        if (dist < dist2) mainEmissive += exp(abs(dist)*-.2);
        if (dist2 < dist) particleEmissive += 0.03/abs(dist);
        dist = min(dist, dist2);
        if (dist < .001) {
            break;
        }
        rLen += dist;
    }

    vec3 color;

    // color = vec3(exp(-.4*rLen));

    color = .03 * mainEmissive * vec3(1., .5, .1);
    // color += .3 * particleEmissive * vec3(.3, .3, .7);
    
    // パーティクル点滅
    color += .1*particleEmissive * vec3(.1 + .9 * pow(abs(sin(time * pi * 4.)), 4.), .7, 2.);

    // カラーグレーディング
    color = clamp(pow(color * 1.3, vec3(1.4)), 0., 1.);

    gl_FragColor = vec4(color, 1.0);
}