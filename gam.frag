precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;

const float EPS = 0.0001;
const float PI = 3.14159265;
const float angle = 60.0;
const float fov = angle * 0.5 * PI / 180.0;
vec3  cPos = vec3(0.0, .0, 2.0);
vec3 cDir = normalize(vec3(-.0, -.0, -1.));
// const vec3 cDir = normalize(vec3(0., 1., 0.));
const vec3 cUp = vec3(0., 1., 0.);
const float sphereSize = 1.0;
vec3 lightDir = vec3(-0.577, 0.577, 0.577);

vec2 onRep(vec2 p, float interval){
    return mod(p, interval) - interval * 0.5;
}

mat2 rotateZ(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

float barDist(vec2 p, float interval, float width){
    return length(max(abs(onRep(p, interval)) - width, 0.));
}

float tubeDist(vec2 p, float interval, float width){
    return length(onRep(p, interval)) - width;
}

float distFunc(vec3 p) {
    float angle = time * PI * 2.0 * .05; // 時間で回転

    mat2 rot = rotateZ(angle);
    p.xy = rot * p.xy; // Z軸回転（XY平面を回す）

    p.z -= time; // カメラ方向に移動

    float bar_x = barDist(p.yz, 1., 0.1);
    float bar_y = barDist(p.xz, 1., 0.1);
    float bar_z = barDist(p.xy, 1., 0.1);

    float tube_x = tubeDist(p.yz, .1, 0.025);
    float tube_y = tubeDist(p.xz, .1, 0.025);
    float tube_z = tubeDist(p.xy, .1, 0.025);

    float tubes = min(min(tube_x, tube_y), tube_z);
    float bars = min(bar_z, min(bar_x, bar_y));

    return max(-tubes, bars);
}
vec3 getNormal(vec3 p){
    return normalize(vec3(
        distFunc(p + vec3(  EPS, 0.0, 0.0)) - distFunc(p + vec3( -EPS, 0.0, 0.0)),
        distFunc(p + vec3(0.0,   EPS, 0.0)) - distFunc(p + vec3(0.0,  -EPS, 0.0)),
        distFunc(p + vec3(0.0, 0.0,   EPS)) - distFunc(p + vec3(0.0, 0.0,  -EPS))
    ));
}


void main(void){
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

    // ライトの方向を時間で変化させる
    // lightDir = normalize(vec3(sin(time * 3.0), cos(time * 2.0) * 2.0, 1.0));

    //カメラ回転

    vec3 cSide = cross(cDir, cUp);
    float targetDepth = 1.0;

    vec3 ray = normalize(cSide * p.x + cUp * p.y + cDir * targetDepth);
    // vec3 ray = normalize(vec3(sin(fov) * p.x, sin(fov) * p.y, -cos(fov)));

    float distance = 0.;
    float rLen = 0.;
    vec3 rPos = cPos;
    int step = 0;
    for(int i=0; i<256; i++){
        step++;
        distance = distFunc(rPos);
        rLen += distance;
        rPos = cPos + ray * rLen;
    }

    vec3 color;
    if(distance < 0.001){
        vec3 normal = getNormal(rPos);
        // float diff = clamp(dot(lightDir, normal), .1, 1.0);
        float diff = clamp(abs(dot(lightDir, normal)), .1, 1.0);
        color = vec3(1.0, 0.0, 0.0) * diff;
    }else{
        color = vec3(1.0, 1.0, 1.0);
    }

    // color += vec3(float(step) * 0.0005);
    color += length(rPos)/20.;
    gl_FragColor = vec4(color, 1.0);
}