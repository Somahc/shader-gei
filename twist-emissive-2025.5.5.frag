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

mat2 rot(float r) {
    return mat2(cos(r),sin(r),-sin(r),cos(r));
}

vec2 pmod(vec2 p, float r) {
    float a = atan(p.x, p.y) + pi / r;
    float n = pi2 / r;
    a = floor(a / n) * n;
    return p * rot(-a);
}

vec3 twist(vec3 p, float power){
    float s = sin(power * p.z);
    float c = cos(power * p.z);
    mat3 m = mat3(
          c,   s, 0.0,
         -s,   c, 0.0,
        0.0, 0.0, 1.0
    );
    return m * p;
}

float sdBox(vec3 p, vec3 b) {
    return length(max(abs(p) - b, 0.));
}


float distSphere(vec3 p, float r){
    return length(p) - r;
}

float distFunc(vec3 p){
    p = twist(p, sin(time * .3) * .25);
    p.z += time * 2.;

    float a = 2.;

    p.xy = pmod(p.xy, 6.);

    p = mod(p, a) - a / 2.;

    float s1 = distSphere(p, .5);
    float d1 = sdBox(p, vec3(10., .2, .2));
    float d2 = sdBox(p, vec3(.2, .2, 10.));
    float d3 = sdBox(p, vec3(.2, 10., .2));


    return min(min(min(s1, d1), d2), d3);
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

    float radius = .1;
    float phi = time * .2;
    
    // vec3 ro = vec3(cos(phi) * radius, 0., sin(phi) * radius); // ray origin
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

    float mainEmissive = .0;
    float phantom = 0.0;

    for(int i = 0; i < 100; i++) {
        step++;
        dist = distFunc(rPos);
        rLen += dist;
        rPos = ro + rd * rLen * cos(time * .5);
        // rPos = ro + rd * rLen;



        mainEmissive += exp(abs(dist)*-.2);
        // phantom += exp(-dist * 1.);

        if (dist < EPS) {
            break;
        }
    }

    vec3 color;


    color = vec3(exp(-.4 * rLen));
    color = 0.03 * mainEmissive * vec3(0.2941, 0.3059, 1.0);

    gl_FragColor = vec4(color, 1.0);

}