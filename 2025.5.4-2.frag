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

float distSphere(vec3 p, float r){
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); 
}

mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
}

vec2 pmod(vec2 p, float r) {
    float a = atan(p.x, p.y) + pi / r;

    float n = pi2 / r;
    a = floor(a / n) * n;

    return p * rot(-a);
}

vec3 foldX(vec3 p) {
    p.x = abs(p.x);
    return p;
}

vec3 foldY(vec3 p) {
    p.y = abs(p.y);
    return p;
}

vec3 foldZ(vec3 p) {
    p.z = abs(p.z);
    return p;
}

vec3 hsv2rgb(vec3 c){
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float distFunc(vec3 p){
    // float sphere = distSphere(p, sphereSize);
    // return sphere;

    // p.xy *= rot(.5);

    // p = foldX(p);
    // p = foldY(p);
    // p = foldX(p);
    for(int i = 0; i < 5; i++) {
        p = abs(p) - 3.;
        p.xy *= rot(sin(time / 2.));
        p.yz *= rot(sin(time / 2.));
    }

    float box = sdBox(p, vec3(.5, 2., 2.));
    // float box = sdBox(p, vec3(.5, .05, 0.1));
    return box;
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
    float radius = 5.0;
    float angle = -time / 3.;

    // カメラ回転
    vec3 ro = vec3(cos(angle) * radius, 0., sin(angle) * radius); // ray origin
    ro = vec3(0., 0., -3); // ray origin offset
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

    for(int i = 0; i < 80; i++) {
        step++;
        dist = distFunc(rPos);
        rLen += dist;
        rPos = ro + rd * rLen;
        if (abs(dist) < EPS) {
            break;
        }
    }


    vec3 color;
    // HSVで色付け
    float h = fract((rPos.z) * 0.02); // 色相：XZ位置ベース（スケールは調整）
    float s = 0.8; // 彩度
    float v = .7; // 明度

    color = hsv2rgb(vec3(h, s, v));
    color += vec3(float(step) * 0.009);
    color += length(rPos) / 240.;


    // if (dist < 0.001){
    //     vec3 n = normal(rPos) * 0.5 + 0.5;
    //     color = n;

    // }else{
    //     // color = vec3(0.5, 0.8, 1.5) * abs(p.y * 0.5 - 1.0) ;
    //     color = vec3(0.0);
    // }
    
    gl_FragColor = vec4(color, 1.0);

}