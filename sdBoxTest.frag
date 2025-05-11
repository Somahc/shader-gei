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

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float distFunc(vec3 p){
    return sdBox(p + vec3(0., 0., 0.), vec3(1., 2., 1.));
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

    float mainEmissive = 0.0;

    vec3 color;
    for(int i = 0; i < 100; i++) {
        step++;
        dist = distFunc(rPos);

        if (abs(dist) < EPS) {
            break;
        }
        rLen += dist;
        rPos += rd * dist;

    }

    color = vec3(exp(-.1 * rLen));
    gl_FragColor = vec4(color, 1.0);

}