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

void main(void){
    vec2 p = (gl_FragCoord.xy * 2. - resolution) / min(resolution.x, resolution.y);
    
    vec3  cPos = vec3(0.0, .0, 2.0);
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