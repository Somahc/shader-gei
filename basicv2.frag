precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;

const float EPS = 0.0001;
const float PI = 3.14159265;
const float angle = 60.0;
const float fov = angle * 0.5 * PI / 180.0;
const float sphereSize = 1.0;
vec3 lightDir = vec3(-0.577, 0.577, 0.577);

float distSphere(vec3 p, float r){
    return length(p) - r;
}

float distFunc(vec3 p){
    float sphere = distSphere(p, sphereSize);
    return sphere;
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