#define opRep(p, interval) (mod(p, interval) - 0.5 * interval)
#define opRepLimit(p, interval, limit) (mod(clamp(p, -limit, limit), interval) - 0.5 * interval)

precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;

const float EPS = 0.0001;
const float PI = 3.14159265;
const float PI2 = PI * 2.0;
const float angle = 60.0;
const float fov = angle * 0.5 * PI / 180.0;
const float sphereSize = 1.0;
vec3 lightDir = vec3(-0.577, 0.577, 0.577);

vec3 foldX(vec3 p) {
    p.x = abs(p.x);
    return p;
}


mat2 rotate(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

float distSdBox(vec3 p, vec3 b){
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.);
}

float distSphere(vec3 p, float r){
    return length(p) - r;
}

// ループなし
float dTree(vec3 p) {
    vec3 size = vec3(.1, 1., .1);
    float d = distSdBox(p, size);
    p = foldX(p);
    p.y -= 0.1;
    p.xy *= rotate(-1.2);
    d = min(d, distSdBox(p, size));
    return d;
}

// ループあり
float dTreeFractal(vec3 p) {
    float scale = 0.8;
    vec3 size = vec3(.1, 1., .1);
    float d = distSdBox(p, size);
    for (int i = 0; i < 10; i++) {
        vec3 q = foldX(p);
        q.y -= size.y;
        q.xy *= rotate(-0.5);
        d = min(d, distSdBox(p, size));
        p = q;
        size *= scale;
    }
    return d;
}

vec2 pmod(in vec2 p, in float s) {
    float a = PI / s - atan(p.x, p.y);
    float n = PI2 / s;
    a = floor(a / n) * n;
    p *= rotate(a);
    return p;
}

float dSnowCrystal(inout vec3 p) {
    p.xy = pmod(p.xy, 6.);
    return dTreeFractal(p);
}

float distFunc(vec3 p){
    // float sphere = distSphere(p, sphereSize);
    // return distSdBox(p, vec3(.4));

    // return dTreeFractal(p);
    // return dTree(p);
    return dSnowCrystal(p);

}

void main(void){
    vec2 p = (gl_FragCoord.xy * 2. - resolution) / min(resolution.x, resolution.y);
    
    vec3  cPos = vec3(0.0, .0, 4.0);
    vec3 cDir = normalize(vec3(-.0, -.0, -1.));
    vec3 cUp = vec3(0., 1., 0.);
    vec3 cSide = cross(cDir, cUp);
    float targetDepth = 1.;

    vec3 ray = normalize(cSide * p.x + cUp * p.y + cDir * targetDepth);

    float dist = 0.;
    float rLen = 0.;
    vec3 rPos = cPos;
    int step = 0;

    for(int i = 0; i < 100; i++) {
        step++;

        // rPos = foldX(rPos);
        // rPos -= vec3(.5, 0., 0.);

        dist = distFunc(rPos);
        rLen += dist;
        rPos = cPos + ray * rLen;
    }

    vec3 color;
    if (dist < 0.001){
        color = vec3(1.0);

    }else{
        color = vec3(0.0);
    }
    
    gl_FragColor = vec4(color, 1.0);

}