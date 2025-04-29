precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;

const float PI = 3.14159265;
const float angle = 60.0;
const float fov = angle * 0.5 * PI / 180.0;
vec3  cPos = vec3(0.0, .5, 2.0);
const float sphereSize = 1.0;
const vec3 lightDir = vec3(-0.577, 0.577, 0.577);

vec3 trans(vec3 p) {
    return mod(p, 4.0) - 2.0;
}

float distFuncTorus(vec3 p) {
    vec2 t = vec2(.75, .25);
    vec2 r = vec2(length(p.xy) - t.x, p.z);
    return length(r) - t.y;
}

float distFuncFloor(vec3 p) {
    return dot(p, vec3(0., 1.0, 0.)) + .3;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}
// OR
// float distFunc(vec3 p) {
//     float d1 = distFuncTorus(p);
//     float d2 = sdBox(p, vec3(2.5, 0.2, 0.5));
//     return min(d1, d2);
// }
// AND
// float distFunc(vec3 p) {
//     float d1 = distFuncTorus(p);
//     float d2 = sdBox(p, vec3(2.5, 0.2, 0.5));
//     return max(d1, d2);
// }
// 重なり合う部分をレンダリングしない
float distFunc(vec3 p) {
    float d1 = distFuncTorus(p);
    float d2 = sdBox(p, vec3(2.5, 0.2, 0.5));
    // return max(-d1, d2);
    return max(d1, -d2);
}

vec3 getNormal(vec3 p){
    float d = 0.0001;
    return normalize(vec3(
        distFunc(p + vec3(  d, 0.0, 0.0)) - distFunc(p + vec3( -d, 0.0, 0.0)),
        distFunc(p + vec3(0.0,   d, 0.0)) - distFunc(p + vec3(0.0,  -d, 0.0)),
        distFunc(p + vec3(0.0, 0.0,   d)) - distFunc(p + vec3(0.0, 0.0,  -d))
    ));
}

void main(void){
    // fragment position
    // vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
    
    // ray
    vec3 ray = normalize(vec3(sin(fov) * p.x, sin(fov) * p.y, -cos(fov)));	
    
    // marching loop
    float distance = 0.0;
    float rLen = 0.0;
    vec3  rPos = cPos;
    for(int i = 0; i < 256 * 4; i++){
        // distance = distFunc(rPos);
        distance = distFunc(rPos);
        rLen += distance;
        rPos = cPos + ray * rLen;
    }
    
    // hit check
    vec3 color;
    if(abs(distance) < 0.001){
        vec3 normal = getNormal(rPos);
        float diff = clamp(dot(lightDir, normal), 0.1, 1.0);
        color = vec3(1., 1., 1.) * diff;
    }else{
        color = vec3(0.);
    }

    gl_FragColor = vec4(color, 1.0);
}