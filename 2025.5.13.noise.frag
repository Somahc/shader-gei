precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;

const float EPS = 0.0001;
const float pi = acos(-1.0);
const float pi2 = pi * 2.0;

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on The Book of Shaders
// See: https://thebookofshaders.com/13/?lan=jp
float noise (in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;    
}

#define OVTAVES 6
float fbm (in vec2 p) {
    float value = 0.;
    float amplitude = 0.5;
    float frequency = 0.;

    for (int i = 0; i < OVTAVES; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main(void){
    vec2 p = gl_FragCoord.xy / resolution.xy;

    vec3 color = vec3(0.0);

    vec2 q = vec2(0.);
    q.x = fbm(p);
    q.y = fbm(p + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm(p + q + vec2(1.7, 9.2) + 0.015 * time);
    r.y = fbm(p + q + vec2(5.1, 1.2) + 0.052 * time + vec2(1.0));

    float f = fbm(p + r);

    // color += vec3(f);

    color = mix(vec3(0.0, 0.2, 0.5),vec3(0.2, 1.0, 0.3),
    clamp(f*f*2., 0.0, 1.0));

    color = mix(color, vec3(0., 0., 0.123455),
    clamp(length(q), 0., 1.));

    color = mix(color, vec3(.33333, 1., 1.),
    clamp(length(r.x), 0., 1.));

    color *= vec3(f*f*f + 4. * f * f + 2. * f);

    gl_FragColor = vec4(color, 1.0);

}