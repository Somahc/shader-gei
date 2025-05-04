precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;

const float EPS = 0.0001;
const float PI = acos(-1.);
const float PI2 = PI * 2.0;
const float angle = 60.0;
const float fov = angle * 0.5 * PI / 180.0;
const float sphereSize = 1.0;
vec3 lightDir = vec3(-0.577, 0.577, 0.577);

float distSphere(vec3 p, float r){
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); 
}

vec2 onRep(vec2 p, float interval) {
    return mod(p, interval) - interval * 0.5;
}

void rot(inout vec2 p, float a) { p = mat2(cos(a), sin(a), -sin(a), cos(a)) * p; }

float barDist(vec2 p, float interval, float width){
    return length(max(abs(onRep(p, interval)) - width, 0.));
}

float map(vec3 p) {
    // p = onRep(p, 4.5);
    float a = 2.;
    // p = mod(p, a) - a / 2.;
    float s = 1.0;

    for(int i = 0; i < 3; i++) {
        p = abs(p) - .5 + .04 * sin(time * PI2 / 4.);
        rot(p.xy, .5);

        float b = 1.3 + .1 * sin(time * PI2 / 4.);
        p *= b;
        s *= b;
    }

    return sdBox(p, vec3(.5, .05, .05)) / s;

}

float distFunc(vec3 p){
    // float bar_xy = barDist(p.xy, 1., 0.1);
    // float bar_xz = barDist(p.xz, 1., 0.1);
    // float bar_yz = barDist(p.yz, 1., 0.1);

    // return min(min(bar_xy, bar_xz), bar_yz);
    // return min(bar_xy, bar_xz);
    return map(p);
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
    }

    vec3 color;
    if (dist < 0.001){
        vec3 n = normal(rPos) * 0.5 + 0.5;
        color = n;

    }else{
        color = vec3(0.5, 0.8, 1.5) * abs(p.y * 0.5 - 1.0) ;
    }
    
    gl_FragColor = vec4(color, 1.0);

}